import { describe, expect, it } from 'vitest';

import { generateCorrectiveActionPlan } from '../../features/actions/actionPlan';
import {
  buildResolutionActivityLabel,
  canResolveAction,
  getMissingResolutionRequirements,
  type ResolutionEvidencePayload,
} from '../../features/actions/actionResolution';
import type { CorrectiveAction } from '../../lib/supabase';

function action(p: Partial<CorrectiveAction>): CorrectiveAction {
  return {
    id: 'a',
    organization_id: 'org',
    title: 'Non-conformité : test',
    priority: 'medium',
    status: 'in_progress',
    ...p,
  };
}

function evidence(
  patch: Partial<ResolutionEvidencePayload> = {},
): ResolutionEvidencePayload {
  return {
    comment: '',
    employeeName: '',
    employeeId: '',
    photoConfirmed: false,
    managerValidated: false,
    ...patch,
  };
}

describe('getMissingResolutionRequirements', () => {
  it('bloque la clôture d’une action hygiène critique sans preuves', () => {
    const plan = generateCorrectiveActionPlan(
      action({ title: 'Non-conformité : surface sale en rayon frais' }),
    );

    expect(getMissingResolutionRequirements(plan, evidence())).toEqual([
      'commentaire',
      'nom exécutant',
      'matricule',
      'preuve photo',
      'validation manager',
    ]);
    expect(canResolveAction(plan, evidence())).toBe(false);
  });

  it('autorise la clôture quand toutes les obligations critiques sont remplies', () => {
    const plan = generateCorrectiveActionPlan(
      action({ title: 'Non-conformité : température chambre froide élevée' }),
    );
    const completeEvidence = evidence({
      comment: 'Produits isolés, température relevée et manager prévenu.',
      employeeName: 'Marie Dupont',
      employeeId: 'M1234',
      photoConfirmed: true,
      managerValidated: true,
    });

    expect(getMissingResolutionRequirements(plan, completeEvidence)).toEqual(
      [],
    );
    expect(canResolveAction(plan, completeEvidence)).toBe(true);
  });

  it('demande seulement les obligations prévues pour un cas prix non critique', () => {
    const plan = generateCorrectiveActionPlan(
      action({ title: 'Non-conformité : affichage prix incorrect' }),
    );

    expect(getMissingResolutionRequirements(plan, evidence())).toEqual([
      'commentaire',
      'preuve photo',
    ]);
  });
});

describe('buildResolutionActivityLabel', () => {
  it('trace la preuve photo et la validation manager dans le journal', () => {
    expect(
      buildResolutionActivityLabel({
        title: 'Température chambre froide trop élevée',
        evidence: evidence({ photoConfirmed: true, managerValidated: true }),
      }),
    ).toContain('preuve photo confirmée, validation manager confirmée');
  });
});
