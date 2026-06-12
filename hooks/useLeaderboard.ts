import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
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

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'demo-1',
    full_name: 'Marie Dupont',
    email: 'marie@opspilot.com',
    role: 'manager',
    xp: 850,
    level: 8,
    completed_trainings: 12,
    total_audits: 24,
    avg_score: 91,
  },
  {
    id: 'demo-2',
    full_name: 'Demo Employé',
    email: 'demo@opspilot.com',
    role: 'employé',
    xp: 420,
    level: 5,
    completed_trainings: 8,
    total_audits: 12,
    avg_score: 87,
  },
  {
    id: 'demo-3',
    full_name: 'Pierre Martin',
    email: 'pierre@opspilot.com',
    role: 'employé',
    xp: 310,
    level: 4,
    completed_trainings: 5,
    total_audits: 9,
    avg_score: 82,
  },
];

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const fetch = useCallback(async () => {
    if (isLocalDemo) {
      setEntries(DEMO_LEADERBOARD);
      setLoading(false);
      return;
    }
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, full_name, email, role, xp, level, completed_trainings, total_audits, avg_score',
        )
        .eq('organization_id', profile.organization_id)
        .order('xp', { ascending: false })
        .limit(20);

      if (error) {
        mapSupabaseError('Erreur leaderboard', error);
        return;
      }
      setEntries((data as LeaderboardEntry[]) || []);
    } catch (e) {
      mapSupabaseError('Erreur useLeaderboard', e);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { entries, loading, refetch: fetch };
}
