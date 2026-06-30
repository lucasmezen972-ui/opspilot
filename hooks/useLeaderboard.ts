import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { getDemoTeamProfiles } from '../lib/demoData';
import { supabase, type Profile } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export type LeaderboardEntry = Pick<
  Profile,
  | 'id'
  | 'full_name'
  | 'email'
  | 'role'
  | 'xp'
  | 'level'
  | 'completed_trainings'
  | 'total_audits'
  | 'avg_score'
>;

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const fetch = useCallback(async () => {
    if (isLocalDemo) {
      setEntries(getDemoTeamProfiles() as LeaderboardEntry[]);
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
        .select(
          'id, full_name, email, role, xp, level, completed_trainings, total_audits, avg_score',
        )
        .eq('organization_id', profile.organization_id)
        .order('xp', { ascending: false })
        .limit(20);

      if (fetchErr) {
        setError(mapSupabaseError('Erreur leaderboard', fetchErr));
        return;
      }
      setEntries((data as LeaderboardEntry[]) || []);
    } catch (e) {
      setError(mapSupabaseError('Erreur useLeaderboard', e));
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { entries, loading, error, refetch: fetch };
}
