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
  it('calcule le pourcentage relatif au palier courant', () => {
    // Level 3 = XP bracket [200, 300). 250 XP → 50% through the level.
    const p = computeXpProgress(3, 250);
    expect(p.xpForNextLevel).toBe(300);
    expect(p.remaining).toBe(50);
    expect(Math.round(p.percent)).toBe(50);
  });

  it('plafonne le pourcentage à 100', () => {
    const p = computeXpProgress(1, 500);
    expect(p.percent).toBe(100);
    expect(p.remaining).toBe(0);
  });

  it("affiche 0% au debut d'un palier", () => {
    // Level 3 starts at XP 200
    const p = computeXpProgress(3, 200);
    expect(p.percent).toBe(0);
    expect(p.remaining).toBe(100);
  });
});

describe('buildProfileStats', () => {
  it('produit quatre statistiques avec des valeurs par défaut sûres', () => {
    const stats = buildProfileStats(null);
    expect(stats).toHaveLength(4);
    expect(stats.map((s) => s.value)).toEqual(['0', '0%', '0', '0h']);
  });
});
