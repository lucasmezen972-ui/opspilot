import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Profile } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export type LeaderboardEntry = Pick<Profile,
  'id' | 'full_name' | 'email' | 'role' | 'xp' | 'level' | 'completed_trainings' | 'total_audits' | 'avg_score'
>;

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetch = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, xp, level, completed_trainings, total_audits, avg_score')
        .eq('organization_id', profile.organization_id)
        .order('xp', { ascending: false })
        .limit(20);

      if (error) { mapSupabaseError('Erreur leaderboard', error); return; }
      setEntries((data as LeaderboardEntry[]) || []);
    } catch (e) {
      mapSupabaseError('Erreur useLeaderboard', e);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { entries, loading, refetch: fetch };
}
