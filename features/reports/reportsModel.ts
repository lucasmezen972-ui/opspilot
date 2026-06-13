import type { LucideIcon } from 'lucide-react-native';
import {
  TrendingUp,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Wrench,
  ClipboardCheck,
} from 'lucide-react-native';

import type { Audit, CorrectiveAction } from '../../lib/supabase';

export interface ReportStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

/** Audits terminés, triés implicitement par la source. */
export function getCompletedAudits(audits: Audit[]): Audit[] {
  return audits.filter((a) => a.status === 'completed');
}

/** Score moyen des audits terminés notés, ou null si aucun. */
export function getAverageScore(completed: Audit[]): number | null {
  const scored = completed.filter((a) => a.score != null);
  if (scored.length === 0) return null;
  return Math.round(
    scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length,
  );
}

/** Taux d'audits conformes (score ≥ 80), ou null si aucun audit terminé. */
export function getConformityRate(completed: Audit[]): number | null {
  if (completed.length === 0) return null;
  const conform = completed.filter((a) => (a.score ?? 0) >= 80).length;
  return Math.round((conform / completed.length) * 100);
}

/** Six indicateurs de synthèse prêts à afficher. */
export function buildReportStats(
  audits: Audit[],
  actions: CorrectiveAction[],
): ReportStat[] {
  const completed = getCompletedAudits(audits);
  const avgScore = getAverageScore(completed);
  const conformityRate = getConformityRate(completed);
  const openActions = actions.filter(
    (a) => a.status === 'open' || a.status === 'in_progress',
  ).length;
  const resolvedActions = actions.filter((a) => a.status === 'done').length;
  const issues = audits.reduce((sum, a) => sum + (a.issues_count ?? 0), 0);

  return [
    {
      label: 'Audits terminés',
      value: completed.length,
      icon: ClipboardCheck,
      color: '#2563EB',
    },
    {
      label: 'Score moyen',
      value: avgScore != null ? `${avgScore}%` : '—',
      icon: TrendingUp,
      color: avgScore != null && avgScore >= 80 ? '#10B981' : '#F59E0B',
    },
    {
      label: 'Taux de conformité',
      value: conformityRate != null ? `${conformityRate}%` : '—',
      icon: CheckCircle,
      color:
        conformityRate != null && conformityRate >= 80 ? '#10B981' : '#EF4444',
    },
    {
      label: 'Actions ouvertes',
      value: openActions,
      icon: Wrench,
      color: openActions > 0 ? '#F59E0B' : '#10B981',
    },
    {
      label: 'Actions résolues',
      value: resolvedActions,
      icon: CheckCircle,
      color: '#10B981',
    },
    {
      label: 'Non-conformités',
      value: issues,
      icon: AlertTriangle,
      color: '#EF4444',
    },
  ];
}
