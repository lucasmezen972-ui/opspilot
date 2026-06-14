export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'Aucune' },
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
];

export function recurrenceLabel(value: Recurrence | null | undefined): string {
  return RECURRENCE_OPTIONS.find((o) => o.value === value)?.label ?? 'Aucune';
}

export function isRecurring(value: Recurrence | null | undefined): boolean {
  return value === 'daily' || value === 'weekly' || value === 'monthly';
}

/**
 * Prochaine échéance d'une tâche récurrente, décalée depuis `from`.
 * Renvoie une date ISO (YYYY-MM-DD) ou null si non récurrente.
 */
export function nextDueDate(
  recurrence: Recurrence | null | undefined,
  from: Date = new Date(),
): string | null {
  if (!isRecurring(recurrence)) return null;
  const next = new Date(from.getTime());
  next.setHours(0, 0, 0, 0);
  if (recurrence === 'daily') next.setDate(next.getDate() + 1);
  else if (recurrence === 'weekly') next.setDate(next.getDate() + 7);
  else if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1);
  // Formatage à partir des composants locaux : passer par toISOString()
  // reconvertit en UTC et décale d'un jour dans les fuseaux UTC+.
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
