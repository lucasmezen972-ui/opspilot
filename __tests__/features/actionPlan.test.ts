import { describe, it, expect } from 'vitest';

import {
  buildLocalActionPlan,
  formatActionPlanText,
  buildActionPlanPrompt,
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

describe('buildLocalActionPlan', () => {
  it('adapte le délai à la criticité', () => {
    expect(
      buildLocalActionPlan(action({ priority: 'critical' }))
        .recommendedDeadlineDays,
    ).toBe(1);
    expect(
      buildLocalActionPlan(action({ priority: 'low' })).recommendedDeadlineDays,
    ).toBe(14);
  });

  it('détecte un thème chaîne du froid', () => {
    const plan = buildLocalActionPlan(
      action({ title: 'Non-conformité : température DLC non respectée' }),
    );
    expect(plan.rootCauses.join(' ')).toMatch(/froid/i);
    expect(plan.steps.length).toBeGreaterThan(2);
  });

  it('retombe sur un plan générique hors thème connu', () => {
    const plan = buildLocalActionPlan(
      action({ title: 'Non-conformité : sujet inhabituel xyz' }),
    );
    expect(plan.rootCauses.length).toBeGreaterThan(0);
    expect(plan.prevention.length).toBeGreaterThan(0);
  });
});

describe('formatActionPlanText', () => {
  it('produit un texte sectionné lisible', () => {
    const text = formatActionPlanText(buildLocalActionPlan(action({})));
    expect(text).toContain('CAUSES PROBABLES');
    expect(text).toContain('ÉTAPES CORRECTIVES');
    expect(text).toContain('PRÉVENTION');
    expect(text).toMatch(/Délai recommandé/);
  });
});

describe('buildActionPlanPrompt', () => {
  it('inclut le titre et la priorité de la non-conformité', () => {
    const prompt = buildActionPlanPrompt(
      action({ title: 'Non-conformité : allergènes', priority: 'high' }),
    );
    expect(prompt).toContain('allergènes');
    expect(prompt).toContain('high');
  });
});
