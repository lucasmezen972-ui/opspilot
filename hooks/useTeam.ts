import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Profile } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useTeam() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchMembers = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('full_name', { ascending: true });

      if (error) {
        mapSupabaseError('Erreur récupération équipe', error);
        return;
      }

      setMembers(data || []);
    } catch (error) {
      mapSupabaseError('Erreur useTeam', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateMemberRole = async (memberId: string, role: Profile['role']) => {
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
      return { data: null, error: mapSupabaseError('Erreur updateMemberRole', error) };
    }
  };

  return { members, loading, refetch: fetchMembers, updateMemberRole };
}
