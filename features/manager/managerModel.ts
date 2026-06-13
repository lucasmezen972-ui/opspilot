import type { Audit, Store, Task } from '../../lib/supabase';

export interface ManagerStats {
  pendingAudits: number;
  inProgressAudits: number;
  completedAudits: number;
  avgScore: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  highPriorityTasks: number;
  totalAudits: number;
  totalTasks: number;
}

export function computeManagerStats(
  audits: Audit[],
  tasks: Task[],
): ManagerStats {
  const scoredAudits = audits.filter((a) => a.score != null);
  const avgScore =
    scoredAudits.length > 0
      ? Math.round(
          scoredAudits.reduce((sum, a) => sum + (a.score ?? 0), 0) /
            scoredAudits.length,
        )
      : 0;

  return {
    pendingAudits: audits.filter((a) => a.status === 'pending').length,
    inProgressAudits: audits.filter((a) => a.status === 'in_progress').length,
    completedAudits: audits.filter((a) => a.status === 'completed').length,
    avgScore,
    pendingTasks: tasks.filter((t) => t.status === 'pending').length,
    inProgressTasks: tasks.filter((t) => t.status === 'in_progress').length,
    completedTasks: tasks.filter((t) => t.status === 'completed').length,
    highPriorityTasks: tasks.filter(
      (t) => t.priority === 'high' && t.status !== 'completed',
    ).length,
    totalAudits: audits.length,
    totalTasks: tasks.length,
  };
}

export interface StorePerformance {
  store: Store;
  total: number;
  completed: number;
  avg: number | null;
}

export function computeStoreStats(
  stores: Store[],
  audits: Audit[],
): StorePerformance[] {
  return stores.map((store) => {
    const storeAudits = audits.filter((a) => a.store_id === store.id);
    const completed = storeAudits.filter((a) => a.status === 'completed');
    const scored = completed.filter((a) => a.score != null);
    const avg =
      scored.length > 0
        ? Math.round(
            scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length,
          )
        : null;
    return {
      store,
      total: storeAudits.length,
      completed: completed.length,
      avg,
    };
  });
}

export function getUrgentTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.priority === 'high' && t.status !== 'completed')
    .slice(0, 5);
}

export interface ScoreChip {
  backgroundColor: string;
  color: string;
  label: string;
}

/** Pastille de score d'un magasin (couleur de fond + texte + libellé). */
export function getScoreChip(avg: number | null): ScoreChip {
  if (avg === null) {
    return { backgroundColor: '#F3F4F6', color: '#9CA3AF', label: '—' };
  }
  if (avg >= 80) {
    return { backgroundColor: '#DCFCE7', color: '#16A34A', label: `${avg}%` };
  }
  if (avg >= 60) {
    return { backgroundColor: '#FEF3C7', color: '#D97706', label: `${avg}%` };
  }
  return { backgroundColor: '#FEE2E2', color: '#DC2626', label: `${avg}%` };
}
