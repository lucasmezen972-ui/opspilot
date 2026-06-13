import type { Invitation } from '../../lib/supabase';

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  employé: 'Employé',
  employee: 'Employé',
  stagiaire: 'Stagiaire',
};

const DEFAULT_ROLE_COLOR = { bg: '#DBEAFE', text: '#2563EB' };

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#FEE2E2', text: '#DC2626' },
  manager: { bg: '#EDE9FE', text: '#7C3AED' },
  employé: { bg: '#DBEAFE', text: '#2563EB' },
  employee: { bg: '#DBEAFE', text: '#2563EB' },
  stagiaire: { bg: '#FEF3C7', text: '#D97706' },
};

export const INVITE_ROLES: Invitation['role'][] = [
  'manager',
  'employé',
  'stagiaire',
];

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function getRoleColor(role: string): { bg: string; text: string } {
  return ROLE_COLORS[role] ?? DEFAULT_ROLE_COLOR;
}

/** Libellé relatif de dernière activité (« Aujourd'hui », « Il y a 3 jours »). */
export function formatLastActive(
  date?: string | null,
  now: number = Date.now(),
): string {
  if (!date) return 'Jamais connecté';
  const days = Math.floor((now - new Date(date).getTime()) / 86_400_000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
}
