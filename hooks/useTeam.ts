import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { getDemoTeamProfiles } from '../lib/demoData';
import { supabase, type Profile } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useTeam() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const fetchMembers = useCallback(async () => {
    if (isLocalDemo) {
      setMembers(getDemoTeamProfiles());
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
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('full_name', { ascending: true });

      if (error) {
        setError(mapSupabaseError('Erreur récupération équipe', error));
        return;
      }

      setMembers(data || []);
    } catch (err) {
      setError(mapSupabaseError('Team fetch error', err));
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateMemberRole = async (memberId: string, role: Profile['role']) => {
    if (isLocalDemo) {
      let updated: Profile | null = null;
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id !== memberId) return m;
          updated = { ...m, role };
          return updated;
        }),
      );
      return { data: updated, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError('Erreur mise à jour rôle', error),
        };
      }

      setMembers((prev) => prev.map((m) => (m.id === memberId ? data : m)));
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur updateMemberRole', error),
      };
    }
  };

  return { members, loading, error, refetch: fetchMembers, updateMemberRole };
}
