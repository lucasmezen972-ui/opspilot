import { describe, it, expect } from 'vitest';

import {
  SECTORS,
  ONBOARDING_MODULES,
  defaultModulesForSector,
  onboardingCompleteness,
  buildStarterConfig,
  emptyOnboardingState,
  type OnboardingState,
} from '../../../features/onboarding/onboardingModel';

const CORE = ONBOARDING_MODULES.filter((m) => m.core).map((m) => m.id);

describe('secteurs et modules d’onboarding', () => {
  it('propose les secteurs attendus', () => {
    const ids = SECTORS.map((s) => s.id);
    expect(ids).toContain('supermarche');
    expect(ids).toContain('superette');
    expect(ids).toContain('franchise');
    expect(ids).toContain('specialise');
    expect(ids).toContain('restauration');
  });

  it('active toujours les modules socle', () => {
    for (const sector of SECTORS) {
      const modules = defaultModulesForSector(sector.id);
      for (const core of CORE) {
        expect(modules).toContain(core);
      }
    }
  });

  it('adapte les modules au secteur choisi', () => {
    // Supermarché : tous les modules.
    expect(defaultModulesForSector('supermarche')).toEqual(
      ONBOARDING_MODULES.map((m) => m.id),
    );
    // Magasin spécialisé : pas de module Produits / DLC par défaut.
    expect(defaultModulesForSector('specialise')).not.toContain('products');
    // Supérette : pas de reporting direction au départ.
    expect(defaultModulesForSector('superette')).not.toContain('reports');
    expect(defaultModulesForSector('superette')).toContain('products');
  });
});

describe('onboardingCompleteness', () => {
  it('score faible et étapes manquantes pour un état vide', () => {
    const result = onboardingCompleteness(emptyOnboardingState());
    expect(result.isComplete).toBe(false);
    expect(result.score).toBeLessThan(100);
    expect(result.missing).toContain('Nom de l’organisation');
    expect(result.missing).toContain('Secteur / type de magasin');
    expect(result.missing).toContain('Premier magasin');
    expect(result.missing).toContain('Premier manager');
  });

  it('atteint 100 % quand toutes les étapes sont remplies', () => {
    const state: OnboardingState = {
      organizationName: 'Supermarchés Durand',
      storeName: 'Magasin Centre-Ville',
      sector: 'supermarche',
      modules: defaultModulesForSector('supermarche'),
      managerName: 'Marie Dupont',
    };
    const result = onboardingCompleteness(state);
    expect(result.isComplete).toBe(true);
    expect(result.score).toBe(100);
    expect(result.missing).toEqual([]);
  });
});

describe('buildStarterConfig', () => {
  it('retourne null tant que le secteur n’est pas choisi', () => {
    expect(buildStarterConfig(emptyOnboardingState())).toBeNull();
  });

  it('produit une configuration de départ cohérente avec le secteur', () => {
    const config = buildStarterConfig({
      organizationName: 'Resto Co',
      storeName: 'Cuisine',
      sector: 'restauration',
      modules: defaultModulesForSector('restauration'),
      managerName: 'Chef',
    });
    expect(config?.sector).toBe('restauration');
    expect(config?.recommendedAuditTemplates.length).toBeGreaterThan(0);
    expect(config?.recommendedAuditTemplates).toContain('HACCP alimentaire');
    // Restauration : modules sans reporting direction par défaut.
    expect(config?.modules).not.toContain('reports');
  });
});
