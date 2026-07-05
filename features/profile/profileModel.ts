import type { LucideIcon } from 'lucide-react-native';
import {
  Award,
  ChartBar as BarChart3,
  Target,
  Clock,
} from 'lucide-react-native';

import type { Profile } from '../../lib/supabase';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Administrateur',
  support: 'Support',
  admin: 'Administrateur',
  manager: 'Responsable Magasin',
  employé: 'Employé',
  employee: 'Employé',
  stagiaire: 'Stagiaire',
};

export function getProfileRoleLabel(role?: string | null): string {
  if (!role) return 'Employé';
  return ROLE_LABELS[role] ?? role;
}

export interface ProfileStat {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

/** Quatre statistiques de profil prêtes à afficher. */
export function buildProfileStats(profile: Profile | null): ProfileStat[] {
  return [
    {
      label: 'Audits réalisés',
      value: String(profile?.total_audits ?? 0),
      icon: BarChart3,
      color: '#2563EB',
    },
    {
      label: 'Score moyen',
      value: `${profile?.avg_score ?? 0}%`,
      icon: Target,
      color: '#10B981',
    },
    {
      label: 'Formations',
      value: String(profile?.completed_trainings ?? 0),
      icon: Award,
      color: '#F59E0B',
    },
    {
      label: 'Temps actif',
      value: `${profile?.active_time_hours ?? 0}h`,
      icon: Clock,
      color: '#8B5CF6',
    },
  ];
}

export interface XpProgress {
  level: number;
  xp: number;
  xpForNextLevel: number;
  percent: number;
  remaining: number;
}

/** Progression d'expérience : seuil du niveau suivant, % et XP restants. */
export function computeXpProgress(level: number, xp: number): XpProgress {
  const xpForNextLevel = level * 100;
  const percent =
    xpForNextLevel > 0 ? Math.min((xp / xpForNextLevel) * 100, 100) : 0;
  return {
    level,
    xp,
    xpForNextLevel,
    percent,
    remaining: xpForNextLevel - xp,
  };
}
