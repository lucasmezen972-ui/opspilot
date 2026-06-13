import { describe, it, expect } from 'vitest';

import {
  getProfileRoleLabel,
  buildProfileStats,
  computeXpProgress,
} from '../../features/profile/profileModel';

describe('getProfileRoleLabel', () => {
  it('traduit les rôles et gère les valeurs absentes ou inconnues', () => {
    expect(getProfileRoleLabel('manager')).toBe('Responsable Magasin');
    expect(getProfileRoleLabel('employee')).toBe('Employé');
    expect(getProfileRoleLabel(null)).toBe('Employé');
    expect(getProfileRoleLabel('autre')).toBe('autre');
  });
});

describe('computeXpProgress', () => {
  it('calcule le seuil, le pourcentage et le restant', () => {
    const p = computeXpProgress(3, 250);
    expect(p.xpForNextLevel).toBe(300);
    expect(p.remaining).toBe(50);
    expect(Math.round(p.percent)).toBe(83);
  });

  it('plafonne le pourcentage à 100', () => {
    const p = computeXpProgress(1, 500);
    expect(p.percent).toBe(100);
    expect(p.remaining).toBeLessThan(0);
  });
});

describe('buildProfileStats', () => {
  it('produit quatre statistiques avec des valeurs par défaut sûres', () => {
    const stats = buildProfileStats(null);
    expect(stats).toHaveLength(4);
    expect(stats.map((s) => s.value)).toEqual(['0', '0%', '0', '0h']);
  });
});
