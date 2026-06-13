import { describe, it, expect } from 'vitest';

import {
  filterTasks,
  getTaskStats,
  getEmptyFilterText,
  getPriorityText,
  getTaskStatusText,
} from '../../features/tasks/taskModel';
import type { Task } from '../../lib/supabase';

function task(partial: Partial<Task>): Task {
  return {
    id: 't',
    organization_id: 'org',
    title: 'Tâche',
    priority: 'medium',
    status: 'pending',
    ...partial,
  };
}

const TASKS: Task[] = [
  task({ id: 't1', status: 'pending', assigned_to: 'me' }),
  task({ id: 't2', status: 'in_progress', assigned_to: 'other' }),
  task({ id: 't3', status: 'completed', assigned_to: 'me' }),
  task({ id: 't4', status: 'pending', assigned_to: 'other' }),
];

describe('filterTasks', () => {
  it('renvoie tout pour « all »', () => {
    expect(filterTasks(TASKS, 'all').length).toBe(4);
  });

  it('filtre les tâches assignées à l’utilisateur', () => {
    expect(filterTasks(TASKS, 'my', 'me').map((t) => t.id)).toEqual([
      't1',
      't3',
    ]);
  });

  it('filtre par statut', () => {
    expect(filterTasks(TASKS, 'pending').map((t) => t.id)).toEqual([
      't1',
      't4',
    ]);
    expect(filterTasks(TASKS, 'in_progress').map((t) => t.id)).toEqual(['t2']);
  });
});

describe('getTaskStats', () => {
  it('compte par statut', () => {
    expect(getTaskStats(TASKS)).toEqual({
      pending: 2,
      inProgress: 1,
      completed: 1,
    });
  });
});

describe('getEmptyFilterText', () => {
  it('adapte le message au filtre', () => {
    expect(getEmptyFilterText('all')).toBe('Aucune tâche disponible.');
    expect(getEmptyFilterText('my')).toBe(
      'Aucune tâche qui vous est assignée.',
    );
    expect(getEmptyFilterText('pending')).toBe('Aucune tâche en attente.');
    expect(getEmptyFilterText('in_progress')).toBe('Aucune tâche en cours.');
  });
});

describe('libellés', () => {
  it('traduit priorité et statut', () => {
    expect(getPriorityText('urgent')).toBe('Urgente');
    expect(getPriorityText('low')).toBe('Basse');
    expect(getTaskStatusText('completed')).toBe('Terminée');
    expect(getTaskStatusText('pending')).toBe('À faire');
  });
});
