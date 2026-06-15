import type { ActivityEvent, ActivityEventType } from '../../lib/supabase';

/**
 * Gouvernance & preuves d'exécution.
 *
 * Un audit clôturé (terminé ou annulé) est verrouillé : il devient une preuve
 * d'exécution immuable et ne doit plus être modifié. De même, une formation
 * validée est certifiée et figée.
 */
export function isAuditLocked(audit: { status: string }): boolean {
  return audit.status === 'completed' || audit.status === 'cancelled';
}

export function canEditAudit(audit: { status: string }): boolean {
  return !isAuditLocked(audit);
}

export function isTrainingCertified(
  progress: { status: string } | null | undefined,
): boolean {
  return progress?.status === 'completed';
}

export const ACTIVITY_LABELS: Record<ActivityEventType, string> = {
  audit_completed: 'Audit clôturé',
  action_resolved: 'Action corrective résolue',
  training_certified: 'Formation validée',
  export: 'Export',
};

export function activityCategoryLabel(action: ActivityEventType): string {
  return ACTIVITY_LABELS[action] ?? 'Activité';
}

/** Trie les événements de gouvernance du plus récent au plus ancien. */
export function sortActivity(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export type ActivityFilter = ActivityEventType | 'all';

/** Filtre les événements par type (« all » = aucun filtre). */
export function filterActivity(
  events: ActivityEvent[],
  filter: ActivityFilter,
): ActivityEvent[] {
  if (filter === 'all') return events;
  return events.filter((event) => event.action === filter);
}
