import type { Audit, CorrectiveAction, Task } from '../../lib/supabase';

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Signaux consolidés du cockpit de pilotage (conformité + risques terrain). */
export interface CockpitSignals {
  conformityScore: number;
  scoredAuditCount: number;
  overdueAudits: number;
  criticalActions: number;
  openActions: number;
  overdueTasks: number;
  incompleteTasks: number;
  trainingGaps: number;
  unreadMessages: number;
}

export interface CockpitInput {
  audits: Audit[];
  actions: CorrectiveAction[];
  tasks: Task[];
  /** Couples collaborateur × formation obligatoire non encore validés. */
  trainingGaps: number;
  unreadMessages: number;
  now?: number;
}

function isOverdue(dueDate: string | null | undefined, now: number): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < now;
}

export function computeCockpitSignals(input: CockpitInput): CockpitSignals {
  const now = input.now ?? Date.now();
  const completedScored = input.audits.filter(
    (a) => a.status === 'completed' && a.score != null,
  );
  const conformityScore =
    completedScored.length > 0
      ? Math.round(
          completedScored.reduce((sum, a) => sum + (a.score ?? 0), 0) /
            completedScored.length,
        )
      : 0;

  const isOpen = (status: CorrectiveAction['status']) =>
    status === 'open' || status === 'in_progress';

  return {
    conformityScore,
    scoredAuditCount: completedScored.length,
    overdueAudits: input.audits.filter(
      (a) =>
        a.status !== 'completed' &&
        a.status !== 'cancelled' &&
        isOverdue(a.due_date, now),
    ).length,
    criticalActions: input.actions.filter(
      (a) => a.priority === 'critical' && isOpen(a.status),
    ).length,
    openActions: input.actions.filter((a) => isOpen(a.status)).length,
    overdueTasks: input.tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.status !== 'cancelled' &&
        isOverdue(t.due_date, now),
    ).length,
    incompleteTasks: input.tasks.filter(
      (t) => t.status === 'pending' || t.status === 'in_progress',
    ).length,
    trainingGaps: input.trainingGaps,
    unreadMessages: input.unreadMessages,
  };
}

export interface CockpitRisk {
  id: string;
  severity: RiskSeverity;
  title: string;
  detail: string;
  count: number;
}

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Liste de risques priorisée (plus critique en premier) à partir des signaux. */
export function buildCockpitRisks(signals: CockpitSignals): CockpitRisk[] {
  const risks: CockpitRisk[] = [];

  if (signals.criticalActions > 0) {
    risks.push({
      id: 'critical-actions',
      severity: 'critical',
      count: signals.criticalActions,
      title: 'Actions correctives critiques ouvertes',
      detail: 'Sécurisation immédiate et validation manager requises.',
    });
  }
  if (signals.conformityScore > 0 && signals.conformityScore < 70) {
    risks.push({
      id: 'low-conformity',
      severity: 'critical',
      count: signals.conformityScore,
      title: 'Score de conformité sous le seuil',
      detail: `Conformité à ${signals.conformityScore}% — plan de redressement à engager.`,
    });
  }
  if (signals.overdueAudits > 0) {
    risks.push({
      id: 'overdue-audits',
      severity: 'high',
      count: signals.overdueAudits,
      title: 'Audits en retard',
      detail: 'Échéances dépassées — replanifier et tracer.',
    });
  }
  if (signals.overdueTasks > 0) {
    risks.push({
      id: 'overdue-tasks',
      severity: 'high',
      count: signals.overdueTasks,
      title: 'Tâches en retard',
      detail: 'Réalisation et preuve d’exécution attendues.',
    });
  }
  if (signals.trainingGaps > 0) {
    risks.push({
      id: 'training-gaps',
      severity: 'high',
      count: signals.trainingGaps,
      title: 'Formations obligatoires non validées',
      detail: 'Collaborateurs à relancer pour mise en conformité.',
    });
  }
  if (signals.openActions > signals.criticalActions) {
    risks.push({
      id: 'open-actions',
      severity: 'medium',
      count: signals.openActions,
      title: 'Plans d’action correctifs ouverts',
      detail: 'Suivre l’avancement et confirmer les preuves.',
    });
  }
  if (signals.incompleteTasks > 0) {
    risks.push({
      id: 'incomplete-tasks',
      severity: 'medium',
      count: signals.incompleteTasks,
      title: 'Tâches non réalisées',
      detail: 'À planifier sur la journée.',
    });
  }
  if (signals.unreadMessages > 0) {
    risks.push({
      id: 'unread-messages',
      severity: 'low',
      count: signals.unreadMessages,
      title: 'Communications internes non lues',
      detail: 'Annonces officielles en attente de lecture.',
    });
  }

  return risks.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
}

export interface CockpitHealth {
  label: string;
  severity: RiskSeverity;
}

/** Verdict global de conformité affiché en tête de cockpit. */
export function cockpitHealth(score: number): CockpitHealth {
  if (score >= 90) return { label: 'Excellent', severity: 'low' };
  if (score >= 80) return { label: 'Conforme', severity: 'low' };
  if (score >= 70) return { label: 'À surveiller', severity: 'medium' };
  if (score > 0) return { label: 'Sous le seuil', severity: 'critical' };
  return { label: 'Aucune donnée', severity: 'low' };
}
