import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { updateDemoCollection, useDemoCollection } from '../lib/demoStore';
import { supabase, type Profile } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useTeam() {
  const [remoteMembers, setRemoteMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const demoMembers = useDemoCollection('members');
  const members = isLocalDemo ? demoMembers : remoteMembers;
  const setMembers = isLocalDemo
    ? (updater: (prev: Profile[]) => Profile[]) =>
        updateDemoCollection('members', updater)
    : setRemoteMembers;

  const fetchMembers = useCallback(async () => {
    if (isLocalDemo) {
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
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('full_name', { ascending: true });

      if (fetchErr) {
        setError(mapSupabaseError('Erreur récupération équipe', fetchErr));
        return;
      }

      setRemoteMembers(data || []);
    } catch (err) {
      setError(mapSupabaseError('Erreur useTeam', err));
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateMemberRole = async (memberId: string, role: Profile['role']) => {
    if (isLocalDemo) {
      const existing = members.find((m) => m.id === memberId);
      if (!existing) return { data: null, error: 'Membre introuvable' };
      const updated = { ...existing, role };
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? updated : m)),
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

      setRemoteMembers((prev) =>
        prev.map((m) => (m.id === memberId ? data : m)),
      );
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur updateMemberRole', error),
      };
    }
  };

  const deactivateMember = async (memberId: string) => {
    if (isLocalDemo) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', memberId);
      if (error) {
        return {
          error: mapSupabaseError('Erreur désactivation membre', error),
        };
      }
      setRemoteMembers((prev) => prev.filter((m) => m.id !== memberId));
      return { error: null };
    } catch (error) {
      return {
        error: mapSupabaseError('Erreur deactivateMember', error),
      };
    }
  };

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    updateMemberRole,
    deactivateMember,
  };
}
