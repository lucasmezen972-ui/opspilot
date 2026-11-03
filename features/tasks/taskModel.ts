import type { Task } from '../../lib/supabase';

export type TaskFilter = 'all' | 'my' | 'pending' | 'in_progress';

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '#B91C1C';
    case 'high':
      return '#B91C1C';
    case 'medium':
      return '#92400E';
    case 'low':
      return '#166534';
    default:
      return '#6B7280';
  }
}

export function getPriorityText(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'Urgente';
    case 'high':
      return 'Haute';
    case 'medium':
      return 'Moyenne';
    case 'low':
      return 'Basse';
    default:
      return 'Normale';
  }
}

export function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#166534';
    case 'in_progress':
      return '#92400E';
    default:
      return '#6B7280';
  }
}

export function getTaskStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return 'Terminée';
    case 'in_progress':
      return 'En cours';
    case 'pending':
      return 'À faire';
    default:
      return 'Inconnu';
  }
}

/** Filtre la liste des tâches selon l'onglet sélectionné. */
export function filterTasks(
  tasks: Task[],
  filter: TaskFilter,
  userId?: string,
): Task[] {
  switch (filter) {
    case 'my':
      return tasks.filter((t) => t.assigned_to === userId);
    case 'pending':
      return tasks.filter((t) => t.status === 'pending');
    case 'in_progress':
      return tasks.filter((t) => t.status === 'in_progress');
    default:
      return tasks;
  }
}

export interface TaskStats {
  pending: number;
  inProgress: number;
  completed: number;
}

export function getTaskStats(tasks: Task[]): TaskStats {
  return {
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };
}

/** Message d'état vide adapté au filtre actif. */
export function getEmptyFilterText(filter: TaskFilter): string {
  if (filter === 'all') return 'Aucune tâche disponible.';
  const reason =
    filter === 'my'
      ? 'qui vous est assignée'
      : filter === 'pending'
        ? 'en attente'
        : 'en cours';
  return `Aucune tâche ${reason}.`;
}
