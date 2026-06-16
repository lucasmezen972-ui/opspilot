/**
 * Modèle pur de l'onboarding client : secteurs, modules, complétude et
 * configuration de départ cohérente. Aucune dépendance UI ni réseau.
 */

export type SectorId =
  | 'supermarche'
  | 'superette'
  | 'franchise'
  | 'specialise'
  | 'restauration';

export interface Sector {
  id: SectorId;
  label: string;
  description: string;
}

export const SECTORS: Sector[] = [
  {
    id: 'supermarche',
    label: 'Supermarché',
    description: 'Grande surface alimentaire multi-rayons.',
  },
  {
    id: 'superette',
    label: 'Supérette / proximité',
    description: 'Petit format alimentaire de proximité.',
  },
  {
    id: 'franchise',
    label: 'Franchise alimentaire',
    description: 'Réseau multi-magasins sous enseigne.',
  },
  {
    id: 'specialise',
    label: 'Magasin spécialisé',
    description: 'Enseigne spécialisée (non alimentaire ou niche).',
  },
  {
    id: 'restauration',
    label: 'Restauration / traiteur',
    description: 'Cuisine, traiteur ou restauration commerciale.',
  },
];

export type ModuleId =
  | 'audits'
  | 'actions'
  | 'trainings'
  | 'products'
  | 'reports'
  | 'messaging';

export interface AppModule {
  id: ModuleId;
  label: string;
  description: string;
  /** Module socle, toujours activé (non décochable). */
  core?: boolean;
}

export const ONBOARDING_MODULES: AppModule[] = [
  {
    id: 'audits',
    label: 'Audits',
    description: 'Référentiels et contrôles terrain.',
    core: true,
  },
  {
    id: 'actions',
    label: 'Actions correctives',
    description: 'Plans correctifs et clôture tracée.',
    core: true,
  },
  {
    id: 'trainings',
    label: 'Formations',
    description: 'Parcours quasi-certifiants et attestations.',
  },
  {
    id: 'products',
    label: 'Produits / DLC',
    description: 'Suivi des dates et de la rotation.',
  },
  {
    id: 'reports',
    label: 'Rapports',
    description: 'Synthèses PDF / export direction.',
  },
  {
    id: 'messaging',
    label: 'Messagerie',
    description: 'Communication interne et annonces.',
  },
];

const CORE_MODULES: ModuleId[] = ONBOARDING_MODULES.filter((m) => m.core).map(
  (m) => m.id,
);

const SECTOR_MODULES: Record<SectorId, ModuleId[]> = {
  // Alimentaire multi-rayons : tout est pertinent.
  supermarche: [
    'audits',
    'actions',
    'trainings',
    'products',
    'reports',
    'messaging',
  ],
  // Proximité : pas de reporting direction multi-sites au départ.
  superette: ['audits', 'actions', 'trainings', 'products', 'messaging'],
  // Réseau : reporting multi-sites essentiel.
  franchise: [
    'audits',
    'actions',
    'trainings',
    'products',
    'reports',
    'messaging',
  ],
  // Spécialisé (souvent non périssable) : pas de module Produits / DLC par défaut.
  specialise: ['audits', 'actions', 'trainings', 'reports', 'messaging'],
  // Restauration : DLC clé, reporting non prioritaire au départ.
  restauration: ['audits', 'actions', 'trainings', 'products', 'messaging'],
};

/** Modules activés par défaut selon le secteur choisi (socle toujours inclus). */
export function defaultModulesForSector(sector: SectorId): ModuleId[] {
  const set = new Set<ModuleId>([
    ...CORE_MODULES,
    ...(SECTOR_MODULES[sector] ?? []),
  ]);
  // Préserve l'ordre canonique des modules.
  return ONBOARDING_MODULES.map((m) => m.id).filter((id) => set.has(id));
}

export interface OnboardingState {
  organizationName: string;
  storeName: string;
  sector: SectorId | null;
  modules: ModuleId[];
  managerName: string;
}

export function emptyOnboardingState(): OnboardingState {
  return {
    organizationName: '',
    storeName: '',
    sector: null,
    modules: [...CORE_MODULES],
    managerName: '',
  };
}

export interface OnboardingStep {
  key: string;
  label: string;
  done: boolean;
}

export interface OnboardingCompleteness {
  score: number;
  completedSteps: number;
  totalSteps: number;
  steps: OnboardingStep[];
  missing: string[];
  isComplete: boolean;
}

/** Score de complétude de l'onboarding (0–100) et étapes restantes. */
export function onboardingCompleteness(
  state: OnboardingState,
): OnboardingCompleteness {
  const steps: OnboardingStep[] = [
    {
      key: 'organization',
      label: 'Nom de l’organisation',
      done: state.organizationName.trim().length > 1,
    },
    {
      key: 'sector',
      label: 'Secteur / type de magasin',
      done: state.sector !== null,
    },
    {
      key: 'modules',
      label: 'Modules activés',
      done: state.modules.length >= CORE_MODULES.length,
    },
    {
      key: 'store',
      label: 'Premier magasin',
      done: state.storeName.trim().length > 1,
    },
    {
      key: 'manager',
      label: 'Premier manager',
      done: state.managerName.trim().length > 1,
    },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  return {
    score: Math.round((completedSteps / totalSteps) * 100),
    completedSteps,
    totalSteps,
    steps,
    missing: steps.filter((s) => !s.done).map((s) => s.label),
    isComplete: completedSteps === totalSteps,
  };
}

export interface StarterConfig {
  sector: SectorId;
  sectorLabel: string;
  modules: ModuleId[];
  /** Modèles d'audit recommandés (cohérents avec le secteur). */
  recommendedAuditTemplates: string[];
}

const SECTOR_AUDIT_TEMPLATES: Record<SectorId, string[]> = {
  supermarche: [
    'HACCP alimentaire',
    'Chaîne du froid',
    'DLC / DDM & rotation',
    'Parking / extérieur magasin',
  ],
  superette: ['Hygiène générale', 'DLC / DDM & rotation', 'Chaîne du froid'],
  franchise: [
    'Conformité franchise',
    'HACCP alimentaire',
    'Préparation visite régionale',
  ],
  specialise: [
    'Hygiène générale',
    'Sécurité incendie & ERP',
    'Parking / extérieur magasin',
  ],
  restauration: ['HACCP alimentaire', 'Chaîne du froid', 'Hygiène générale'],
};

/** Construit la configuration de départ cohérente avec le secteur. */
export function buildStarterConfig(
  state: OnboardingState,
): StarterConfig | null {
  if (!state.sector) return null;
  const sector = state.sector;
  const label = SECTORS.find((s) => s.id === sector)?.label ?? sector;
  const modules =
    state.modules.length > 0 ? state.modules : defaultModulesForSector(sector);
  return {
    sector,
    sectorLabel: label,
    modules,
    recommendedAuditTemplates: SECTOR_AUDIT_TEMPLATES[sector] ?? [],
  };
}
