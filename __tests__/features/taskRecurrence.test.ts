import { describe, it, expect } from 'vitest';

import {
  isRecurring,
  recurrenceLabel,
  nextDueDate,
} from '../../features/tasks/taskRecurrence';

describe('isRecurring', () => {
  it('distingue récurrent et non récurrent', () => {
    expect(isRecurring('none')).toBe(false);
    expect(isRecurring(undefined)).toBe(false);
    expect(isRecurring('weekly')).toBe(true);
  });
});

describe('recurrenceLabel', () => {
  it('libelle les fréquences', () => {
    expect(recurrenceLabel('daily')).toBe('Quotidienne');
    expect(recurrenceLabel('monthly')).toBe('Mensuelle');
    expect(recurrenceLabel('none')).toBe('Aucune');
  });
});

describe('nextDueDate', () => {
  const base = new Date('2026-06-14T10:00:00Z');

  it('null pour une tâche non récurrente', () => {
    expect(nextDueDate('none', base)).toBeNull();
  });

  it('décale d’un jour / une semaine / un mois', () => {
    expect(nextDueDate('daily', base)).toBe('2026-06-15');
    expect(nextDueDate('weekly', base)).toBe('2026-06-21');
    expect(nextDueDate('monthly', base)).toBe('2026-07-14');
  });
});
