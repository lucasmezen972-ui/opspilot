import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Invitation } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';
import { isManagerRole } from '../utils/roles';

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const canManage = isManagerRole(profile?.role);

  const fetchInvitations = useCallback(async () => {
    if (isLocalDemo) {
      setLoading(false);
      return;
    }
    if (!profile?.organization_id || !canManage) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (fetchErr) {
        setError(
          mapSupabaseError(
            'Erreur lors de la récupération des invitations',
            fetchErr,
          ),
        );
        return;
      }

      setInvitations(data || []);
    } catch (err) {
      setError(mapSupabaseError('Erreur fetchInvitations', err));
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, canManage, isLocalDemo]);

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

    if (isLocalDemo) {
      const demo: Invitation = {
        id: `demo-inv-${Date.now()}`,
        organization_id: profile.organization_id,
        email: email.trim().toLowerCase(),
        role,
        store_id: profile.store_id ?? null,
        token: `demo-token-${Date.now()}`,
        invited_by: user.id,
        status: 'pending',
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        created_at: new Date().toISOString(),
      };
      setInvitations((prev) => [demo, ...prev]);
      return { data: demo, error: null };
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
    error,
    canManage,
    createInvitation,
    revokeInvitation,
    refetch: fetchInvitations,
  };
}
