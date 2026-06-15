import { describe, it, expect } from 'vitest';

import {
  buildLocalActionPlan,
  formatActionPlanText,
  buildActionPlanPrompt,
  generateCorrectiveActionPlan,
} from '../../features/actions/actionPlan';
import type { CorrectiveAction } from '../../lib/supabase';

function action(p: Partial<CorrectiveAction>): CorrectiveAction {
  return {
    id: 'c',
    organization_id: 'org',
    title: 'Non-conformité : test',
    priority: 'medium',
    status: 'open',
    ...p,
  };
}

const fixedNow = new Date('2026-06-15T12:00:00.000Z');

function hoursBetween(start: Date, isoEnd: string): number {
  return Math.round((new Date(isoEnd).getTime() - start.getTime()) / 36e5);
}

describe('generateCorrectiveActionPlan', () => {
  it('impose une deadline max 2h pour une non-conformité hygiène critique', () => {
    const plan = generateCorrectiveActionPlan(
      action({
        title: 'Non-conformité : surface sale en rayon frais',
        description: 'Surface sale nécessitant nettoyage et désinfection.',
      }),
      fixedNow,
    );

    expect(plan.category).toBe('Hygiène critique');
    expect(plan.priority).toBe('critical');
    expect(plan.riskLevel).toBe('critical');
    expect(plan.deadlineLabel).toMatch(/2 heures/i);
    expect(plan.recommendedDeadlineHours).toBe(2);
    expect(hoursBetween(fixedNow, plan.dueDate)).toBe(2);
    expect(plan.photoRequired).toBe(true);
    expect(plan.commentRequired).toBe(true);
    expect(plan.employeeNameRequired).toBe(true);
    expect(plan.employeeIdRequired).toBe(true);
    expect(plan.managerValidationRequired).toBe(true);
    expect(plan.escalationRequired).toBe(true);
  });

  it('impose une deadline max 1h pour la chaîne du froid', () => {
    const plan = generateCorrectiveActionPlan(
      action({
        title: 'Non-conformité : température chambre froide trop élevée',
      }),
      fixedNow,
    );

    expect(plan.category).toBe('Chaîne du froid');
    expect(plan.deadlineLabel).toMatch(/1 heure/i);
    expect(plan.recommendedDeadlineHours).toBe(1);
    expect(hoursBetween(fixedNow, plan.dueDate)).toBe(1);
    expect(plan.evidenceRequired.join(' ')).toMatch(/temp[ée]rature/i);
    expect(plan.managerValidationRequired).toBe(true);
  });

  it('impose une deadline max 2h pour une DLC dépassée', () => {
    const plan = generateCorrectiveActionPlan(
      action({ title: 'Non-conformité : DLC dépassée sur yaourts' }),
      fixedNow,
    );

    expect(plan.category).toBe('DLC / DDM dépassée');
    expect(plan.deadlineLabel).toMatch(/2 heures/i);
    expect(plan.recommendedDeadlineHours).toBe(2);
    expect(plan.correctiveAction).toMatch(/retrait|rotation/i);
    expect(plan.evidenceRequired.join(' ')).toMatch(/quantit[ée]/i);
  });

  it('propose 24h pour un affichage prix incorrect', () => {
    const plan = generateCorrectiveActionPlan(
      action({ title: 'Non-conformité : affichage prix promotion incorrect' }),
      fixedNow,
    );

    expect(plan.category).toBe('Affichage prix / balisage');
    expect(plan.recommendedDeadlineHours).toBe(24);
    expect(plan.photoRequired).toBe(true);
    expect(plan.managerValidationRequired).toBe(false);
  });

  it('retombe sur un plan prudent sous 48h hors thème connu', () => {
    const plan = generateCorrectiveActionPlan(
      action({ title: 'Non-conformité : sujet inhabituel xyz' }),
      fixedNow,
    );

    expect(plan.category).toBe('Non-conformité opérationnelle');
    expect(plan.recommendedDeadlineHours).toBe(48);
    expect(plan.rootCauses.length).toBeGreaterThan(0);
    expect(plan.prevention.length).toBeGreaterThan(0);
  });
});

describe('buildLocalActionPlan', () => {
  it('conserve la compatibilité avec l’ancien nom de fonction', () => {
    const plan = buildLocalActionPlan(
      action({ title: 'Non-conformité : température chambre froide' }),
    );

    expect(plan.category).toBe('Chaîne du froid');
    expect(plan.recommendedDeadlineHours).toBe(1);
  });
});

describe('formatActionPlanText', () => {
  it('produit un texte sectionné lisible avec deadline et preuves', () => {
    const text = formatActionPlanText(
      generateCorrectiveActionPlan(
        action({ title: 'Non-conformité : hygiène surface sale' }),
        fixedNow,
      ),
    );
    expect(text).toContain('PROBLÈME CONSTATÉ');
    expect(text).toContain('ACTION IMMÉDIATE');
    expect(text).toContain('ACTION CORRECTIVE');
    expect(text).toContain('ACTION PRÉVENTIVE');
    expect(text).toContain('DEADLINE');
    expect(text).toContain('PREUVES ATTENDUES');
    expect(text).toContain('CHECKLIST');
    expect(text).toMatch(/2 heures/i);
    expect(text).toMatch(/validation manager/i);
  });
});

describe('buildActionPlanPrompt', () => {
  it('inclut le titre, la priorité et la deadline métier imposée', () => {
    const prompt = buildActionPlanPrompt(
      action({ title: 'Non-conformité : allergènes', priority: 'high' }),
    );
    expect(prompt).toContain('allergènes');
    expect(prompt).toContain('high');
    expect(prompt).toContain('Deadline imposée');
    expect(prompt).toContain('Validation manager obligatoire');
  });
});
