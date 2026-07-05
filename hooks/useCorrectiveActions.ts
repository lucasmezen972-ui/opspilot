import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { demoId } from '../lib/demoData';
import { updateDemoCollection, useDemoCollection } from '../lib/demoStore';
import { supabase, type CorrectiveAction } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useCorrectiveActions() {
  const [remoteActions, setRemoteActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, isDemoMode, session } = useAuth();

  // Mode démo local (Supabase injoignable) : store partagé entre écrans.
  const isLocalDemo = isDemoMode && !session;
  const demoActions = useDemoCollection('actions');
  const actions = isLocalDemo ? demoActions : remoteActions;
  const setActions = isLocalDemo
    ? (updater: (prev: CorrectiveAction[]) => CorrectiveAction[]) =>
        updateDemoCollection('actions', updater)
    : setRemoteActions;

  const fetchActions = useCallback(async () => {
    if (isLocalDemo) {
      // Le store démo est déjà alimenté (et partagé) : rien à charger.
      setLoading(false);
      return;
    }
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('corrective_actions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        const msg = mapSupabaseError(
          'Erreur lors de la récupération des actions',
          error,
        );
        setError(msg);
        return;
      }

      setRemoteActions(data || []);
    } catch (err) {
      const msg = mapSupabaseError('Erreur fetchActions', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const createAction = async (actionData: Partial<CorrectiveAction>) => {
    if (!user || !profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    if (isLocalDemo) {
      const now = new Date().toISOString();
      const data: CorrectiveAction = {
        id: demoId('demo-action'),
        organization_id: profile.organization_id,
        store_id: profile.store_id ?? null,
        audit_id: actionData.audit_id ?? null,
        audit_response_id: actionData.audit_response_id ?? null,
        title: actionData.title ?? '',
        description: actionData.description ?? null,
        assignee_id: actionData.assignee_id ?? user.id,
        priority: actionData.priority ?? 'medium',
        status: 'open',
        due_date: actionData.due_date ?? null,
        resolved_at: null,
        created_by: user.id,
        created_at: now,
        updated_at: now,
      };
      setActions((prev) => [data, ...prev]);
      return { data, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('corrective_actions')
        .insert({
          organization_id: profile.organization_id,
          store_id: profile.store_id ?? null,
          assignee_id: actionData.assignee_id ?? user.id,
          created_by: user.id,
          title: actionData.title ?? '',
          description: actionData.description ?? null,
          priority: actionData.priority ?? 'medium',
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
    extra?: Partial<CorrectiveAction>,
  ) => {
    try {
      const updates: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'done') {
        updates.resolved_at = new Date().toISOString();
      }
      // Preuves de clôture contrôlée (commentaire, exécutant, photo, validation).
      if (extra) {
        Object.assign(updates, extra);
      }

      if (isLocalDemo) {
        let updated: CorrectiveAction | null = null;
        setActions((prev) =>
          prev.map((a) => {
            if (a.id !== id) return a;
            updated = { ...a, ...updates } as CorrectiveAction;
            return updated;
          }),
        );
        return { data: updated, error: null };
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
    error,
    createAction,
    updateActionStatus,
    isOverdue,
    getActionsByStatus,
    refetch: fetchActions,
  };
}
