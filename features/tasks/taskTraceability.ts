import type { Task } from '../../lib/supabase';

export interface TaskCompletionInput {
  executantName: string;
  matricule: string;
  comment?: string | null;
  proofPhotoUrl?: string | null;
}

/** Durée d'exécution (minutes) entre début et fin, 0 si indéterminée. */
export function computeDurationMinutes(
  startedAt: string | null | undefined,
  endedAt: string | null | undefined,
): number {
  if (!startedAt || !endedAt) return 0;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 60000);
}

/** Une tâche est validée si un responsable l'a confirmée. */
export function isTaskValidated(task: Pick<Task, 'validated_at'>): boolean {
  return Boolean(task.validated_at);
}

/** Validation possible : tâche terminée et pas encore validée. */
export function canValidateTask(
  task: Pick<Task, 'status' | 'validated_at'>,
): boolean {
  return task.status === 'completed' && !isTaskValidated(task);
}

/** La clôture exige un nom d'exécutant et un matricule (preuve nominative). */
export function isCompletionValid(input: TaskCompletionInput): boolean {
  return input.executantName.trim() !== '' && input.matricule.trim() !== '';
}

/** Libellé court de la preuve d'exécution (réalisé par X · matricule · durée). */
export function executionProofSummary(task: Task): string {
  const parts: string[] = [];
  if (task.completed_by_name) parts.push(task.completed_by_name);
  if (task.completed_by_matricule)
    parts.push(`mat. ${task.completed_by_matricule}`);
  const duration = task.duration_minutes ?? 0;
  if (duration > 0) parts.push(`${duration} min`);
  return parts.join(' · ');
}
