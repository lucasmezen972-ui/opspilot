import { describe, it, expect } from 'vitest';

import {
  getRoleLabel,
  getRoleColor,
  formatLastActive,
} from '../../features/team/teamModel';

describe('getRoleLabel', () => {
  it('traduit les rôles connus et retombe sur la valeur brute', () => {
    expect(getRoleLabel('admin')).toBe('Admin');
    expect(getRoleLabel('employee')).toBe('Employé');
    expect(getRoleLabel('inconnu')).toBe('inconnu');
  });
});

describe('getRoleColor', () => {
  it('renvoie une couleur dédiée ou la couleur par défaut', () => {
    expect(getRoleColor('admin')).toEqual({ bg: '#FEE2E2', text: '#DC2626' });
    expect(getRoleColor('inconnu')).toEqual({ bg: '#DBEAFE', text: '#2563EB' });
  });
});

describe('formatLastActive', () => {
  const now = new Date('2026-06-13T12:00:00Z').getTime();
  const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();

  it('gère l’absence de date', () => {
    expect(formatLastActive(null, now)).toBe('Jamais connecté');
  });

  it('formate aujourd’hui, hier et les jours précédents', () => {
    expect(formatLastActive(daysAgo(0), now)).toBe("Aujourd'hui");
    expect(formatLastActive(daysAgo(1), now)).toBe('Hier');
    expect(formatLastActive(daysAgo(5), now)).toBe('Il y a 5 jours');
  });
});
