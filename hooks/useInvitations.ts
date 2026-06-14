import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Invitation } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const canManage = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchInvitations = useCallback(async () => {
    if (!profile?.organization_id || !canManage) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        mapSupabaseError(
          'Erreur lors de la récupération des invitations',
          error,
        );
        return;
      }

      setInvitations(data || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchInvitations', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, canManage]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const createInvitation = async (
    email: string,
    role: Invitation['role'] = 'employé',
  ) => {
    if (!user || !profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          organization_id: profile.organization_id,
          email: email.trim().toLowerCase(),
          role,
          store_id: profile.store_id ?? null,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError(
            "Erreur lors de la création de l'invitation",
            error,
          ),
        };
      }

      setInvitations((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur createInvitation', error),
      };
    }
  };

  const revokeInvitation = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError(
            "Erreur lors de la révocation de l'invitation",
            error,
          ),
        };
      }

      setInvitations((prev) => prev.map((i) => (i.id === id ? data : i)));
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur revokeInvitation', error),
      };
    }
  };

  return {
    invitations,
    loading,
    canManage,
    createInvitation,
    revokeInvitation,
    refetch: fetchInvitations,
  };
}
