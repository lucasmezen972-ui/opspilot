import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type CorrectiveAction } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useCorrectiveActions() {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const fetchActions = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('corrective_actions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        mapSupabaseError('Erreur lors de la récupération des actions', error);
        return;
      }

      setActions(data || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchActions', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const createAction = async (actionData: Partial<CorrectiveAction>) => {
    if (!user || !profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    try {
      const { data, error } = await supabase
        .from('corrective_actions')
        .insert({
          organization_id: profile.organization_id,
          store_id: profile.store_id || null,
          assignee_id: actionData.assignee_id || user.id,
          created_by: user.id,
          title: actionData.title || '',
          description: actionData.description || null,
          priority: actionData.priority || 'medium',
          status: 'open',
          ...actionData,
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError(
            "Erreur lors de la création de l'action",
            error,
          ),
        };
      }

      setActions((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur createAction', error),
      };
    }
  };

  const updateActionStatus = async (
    id: string,
    status: CorrectiveAction['status'],
  ) => {
    try {
      const updates: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'done') {
        updates.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('corrective_actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError(
            'Erreur lors de la mise à jour du statut',
            error,
          ),
        };
      }

      setActions((prev) => prev.map((a) => (a.id === id ? data : a)));
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur updateActionStatus', error),
      };
    }
  };

  const isOverdue = useCallback((action: CorrectiveAction) => {
    return (
      action.status !== 'done' &&
      action.status !== 'cancelled' &&
      !!action.due_date &&
      new Date(action.due_date) < new Date()
    );
  }, []);

  const getActionsByStatus = useCallback(
    (status: CorrectiveAction['status']) =>
      actions.filter((a) => a.status === status),
    [actions],
  );

  return {
    actions,
    loading,
    createAction,
    updateActionStatus,
    isOverdue,
    getActionsByStatus,
    refetch: fetchActions,
  };
}
