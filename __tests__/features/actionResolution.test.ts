import { describe, expect, it } from 'vitest';

import { generateCorrectiveActionPlan } from '../../features/actions/actionPlan';
import {
  buildResolutionActivityLabel,
  buildResolutionRecord,
  canResolveAction,
  getMissingResolutionRequirements,
  isResolutionAuthorized,
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

describe('buildResolutionRecord', () => {
  it('produit un enregistrement persistable et normalise les champs vides', () => {
    const record = buildResolutionRecord(
      evidence({
        comment: '  Zone nettoyée et vérifiée.  ',
        employeeName: ' Marie Dupont ',
        employeeId: '',
        photoConfirmed: true,
        managerValidated: false,
      }),
      { id: 'profile-1', role: 'manager' },
    );

    expect(record).toEqual({
      resolution_comment: 'Zone nettoyée et vérifiée.',
      resolved_by_name: 'Marie Dupont',
      resolved_by_matricule: null,
      resolution_photo_confirmed: true,
      manager_validated: false,
      resolved_by: 'profile-1',
      resolver_role: 'manager',
    });
  });

  it('tolère l’absence de profil résolveur', () => {
    const record = buildResolutionRecord(evidence({ comment: 'ok' }));
    expect(record.resolved_by).toBeNull();
    expect(record.resolver_role).toBeNull();
  });
});

describe('isResolutionAuthorized', () => {
  const coldChainPlan = () =>
    generateCorrectiveActionPlan(
      action({ title: 'Non-conformité : température chambre froide élevée' }),
    );
  const fullColdChainEvidence = () =>
    evidence({
      comment: 'Produits isolés, température relevée.',
      employeeName: 'Marie Dupont',
      employeeId: 'M-1042',
      photoConfirmed: true,
      managerValidated: true,
    });

  it('refuse la clôture si une preuve obligatoire manque, quel que soit le rôle', () => {
    expect(isResolutionAuthorized(coldChainPlan(), evidence(), 'manager')).toBe(
      false,
    );
  });

  it('empêche un employé de valider seul une action à validation manager', () => {
    expect(
      isResolutionAuthorized(
        coldChainPlan(),
        fullColdChainEvidence(),
        'employé',
      ),
    ).toBe(false);
  });

  it('autorise un manager (ou admin) à valider une action à validation manager', () => {
    expect(
      isResolutionAuthorized(
        coldChainPlan(),
        fullColdChainEvidence(),
        'manager',
      ),
    ).toBe(true);
    expect(
      isResolutionAuthorized(coldChainPlan(), fullColdChainEvidence(), 'admin'),
    ).toBe(true);
  });

  it('autorise un employé à clôturer une action sans validation manager requise', () => {
    const pricingPlan = generateCorrectiveActionPlan(
      action({ title: 'Non-conformité : affichage prix incorrect' }),
    );
    const pricingEvidence = evidence({
      comment: 'Étiquette corrigée et vérifiée en caisse.',
      photoConfirmed: true,
    });
    expect(
      isResolutionAuthorized(pricingPlan, pricingEvidence, 'employé'),
    ).toBe(true);
  });
});
