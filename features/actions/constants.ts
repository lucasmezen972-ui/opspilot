import type { CorrectiveAction } from '../../lib/supabase';

export const STATUS_FLOW: CorrectiveAction['status'][] = [
  'open',
  'in_progress',
  'done',
];

export const STATUS_LABELS: Record<CorrectiveAction['status'], string> = {
  open: 'À traiter',
  in_progress: 'En cours',
  done: 'Résolues',
  cancelled: 'Annulées',
};

export const PRIORITY_COLORS: Record<CorrectiveAction['priority'], string> = {
  critical: '#DC2626',
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

export const PRIORITY_LABELS: Record<CorrectiveAction['priority'], string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};
