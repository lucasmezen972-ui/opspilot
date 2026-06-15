import { describe, it, expect } from 'vitest';

import {
  generateCorrectiveActionPlan,
  formatCorrectiveActionPlanText,
  buildActionPlanPrompt,
  riskLevelLabel,
  type CorrectiveActionInput,
} from '../../features/actions/actionPlan';

function nc(p: Partial<CorrectiveActionInput>): CorrectiveActionInput {
  return { title: 'Non-conformité : test', ...p };
}

const FIXED_NOW = new Date('2026-06-15T08:00:00.000Z');

function hoursUntil(dueDate: string): number {
  return (new Date(dueDate).getTime() - FIXED_NOW.getTime()) / (60 * 60 * 1000);
}

describe('generateCorrectiveActionPlan — délais selon le problème détecté', () => {
  it('hygiène critique : « surface sale en rayon frais » → 2h, critique, preuves complètes', () => {
    const plan = generateCorrectiveActionPlan(
      nc({ title: 'Non-conformité : surface sale en rayon frais' }),
      FIXED_NOW,
    );
    expect(plan.category).toBe('Hygiène critique');
    expect(plan.riskLevel).toBe('critical');
    expect(plan.priority).toBe('critical');
    expect(plan.deadlineHours).toBeLessThanOrEqual(2);
    expect(plan.deadlineHours).toBe(2);
    expect(hoursUntil(plan.dueDate)).toBe(2);
    expect(plan.photoRequired).toBe(true);
    expect(plan.commentRequired).toBe(true);
    expect(plan.employeeNameRequired).toBe(true);
    expect(plan.employeeIdRequired).toBe(true);
    expect(plan.managerValidationRequired).toBe(true);
  });

  it('chaîne du froid : « température chambre froide trop élevée » → 1h, preuve température, validation manager', () => {
    const plan = generateCorrectiveActionPlan(
      nc({ title: 'Non-conformité : température chambre froide trop élevée' }),
      FIXED_NOW,
    );
    expect(plan.category).toBe('Chaîne du froid');
    expect(plan.riskLevel).toBe('critical');
    expect(plan.deadlineHours).toBeLessThanOrEqual(1);
    expect(plan.deadlineHours).toBe(1);
    expect(hoursUntil(plan.dueDate)).toBe(1);
    expect(plan.evidenceRequired.join(' ')).toMatch(/temp[ée]rature/i);
    expect(plan.managerValidationRequired).toBe(true);
    expect(plan.escalationRequired).toBe(true);
  });

  it('DLC : « produit périmé » → max 2h, retrait + quantité', () => {
    const plan = generateCorrectiveActionPlan(
      nc({ title: 'Non-conformité : produit périmé en rayon' }),
      FIXED_NOW,
    );
    expect(plan.category).toBe('DLC / DDM');
    expect(plan.deadlineHours).toBeLessThanOrEqual(2);
    expect(plan.immediateAction).toMatch(/retir|isoler|quantif/i);
    expect(plan.photoRequired).toBe(true);
  });

  it('affichage prix → 24h, risque non critique', () => {
    const plan = generateCorrectiveActionPlan(
      nc({ title: 'Non-conformité : étiquette prix erronée' }),
      FIXED_NOW,
    );
    expect(plan.category).toBe('Affichage prix');
    expect(plan.deadlineHours).toBe(24);
    expect(plan.riskLevel).not.toBe('critical');
  });

  it('facing / merchandising → 48h, risque faible', () => {
    const plan = generateCorrectiveActionPlan(
      nc({ title: 'Non-conformité : facing rayon désordonné' }),
      FIXED_NOW,
    );
    expect(plan.category).toBe('Facing / merchandising');
    expect(plan.deadlineHours).toBe(48);
    expect(plan.riskLevel).toBe('low');
  });

  it('cas inconnu sans signal critique → repli 48h / médian', () => {
    const plan = generateCorrectiveActionPlan(
      nc({ title: 'Non-conformité : sujet inhabituel xyz' }),
      FIXED_NOW,
    );
    expect(plan.deadlineHours).toBe(48);
    expect(plan.riskLevel).toBe('medium');
    expect(plan.probableCause.length).toBeGreaterThan(0);
  });

  it('cas inconnu avec signal critique (danger) → règle prudente 2h critique', () => {
    const plan = generateCorrectiveActionPlan(
      nc({ title: 'Situation avec danger non catégorisé précisément' }),
      FIXED_NOW,
    );
    expect(plan.riskLevel).toBe('critical');
    expect(plan.deadlineHours).toBeLessThanOrEqual(2);
    expect(plan.managerValidationRequired).toBe(true);
  });

  it('ne propose jamais de délai long pour un risque critique', () => {
    const criticalTitles = [
      'température chambre froide',
      'surface sale souillure',
      'produit périmé DLC',
      'issue de secours bloquée',
      'sol glissant danger client',
    ];
    for (const title of criticalTitles) {
      const plan = generateCorrectiveActionPlan(nc({ title }), FIXED_NOW);
      if (plan.riskLevel === 'critical') {
        expect(plan.deadlineHours).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('formatCorrectiveActionPlanText', () => {
  it('produit un texte sectionné lisible et complet', () => {
    const text = formatCorrectiveActionPlanText(
      generateCorrectiveActionPlan(nc({}), FIXED_NOW),
    );
    expect(text).toContain('PROBLÈME CONSTATÉ');
    expect(text).toContain('CAUSE PROBABLE');
    expect(text).toContain('ACTION IMMÉDIATE');
    expect(text).toContain('ACTION CORRECTIVE');
    expect(text).toContain('ACTION PRÉVENTIVE');
    expect(text).toContain('PREUVES ATTENDUES');
    expect(text).toContain('VALIDATION REQUISE');
    expect(text).toContain('RESPONSABLE RECOMMANDÉ');
  });
});

describe('riskLevelLabel', () => {
  it('traduit les niveaux de risque', () => {
    expect(riskLevelLabel('critical')).toBe('Critique');
    expect(riskLevelLabel('low')).toBe('Faible');
  });
});

describe('buildActionPlanPrompt', () => {
  it('inclut la non-conformité et encadre l’IA (validation manager / pas de délai long)', () => {
    const prompt = buildActionPlanPrompt(
      nc({ title: 'Non-conformité : allergènes étiquette' }),
    );
    expect(prompt).toContain('allergènes');
    expect(prompt).toMatch(/validation manager/i);
    expect(prompt).toMatch(/d[ée]lai long/i);
  });
});
