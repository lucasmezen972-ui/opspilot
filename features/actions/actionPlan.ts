import type { CorrectiveAction } from '../../lib/supabase';

export interface ActionPlan {
  /** Synthèse en une phrase. */
  summary: string;
  /** Causes probables identifiées. */
  rootCauses: string[];
  /** Étapes correctives, dans l'ordre. */
  steps: string[];
  /** Mesures préventives pour éviter la récurrence. */
  prevention: string[];
  /** Délai recommandé de traitement (jours), selon la criticité. */
  recommendedDeadlineDays: number;
}

const DEADLINE_BY_PRIORITY: Record<string, number> = {
  critical: 1,
  high: 3,
  medium: 7,
  low: 14,
};

/** Familles de non-conformités détectées par mots-clés (terrain agro/retail). */
const THEMES: {
  match: RegExp;
  causes: string[];
  steps: string[];
  prevention: string[];
}[] = [
  {
    match: /temp[ée]rature|dlc|froid|chaîne du froid|cong[ée]l|r[ée]frig/i,
    causes: [
      'Rupture de la chaîne du froid (équipement, ouverture prolongée ou surcharge).',
      'Sonde ou thermostat déréglé / non étalonné.',
    ],
    steps: [
      'Isoler et bloquer les produits concernés (ne pas remettre en vente).',
      'Relever et consigner les températures réelles ; comparer aux seuils.',
      'Faire intervenir la maintenance sur l’équipement frigorifique.',
      'Statuer sur le devenir des produits (destruction tracée si DLC/sécurité compromise).',
    ],
    prevention: [
      'Mettre en place un relevé de température biquotidien tracé.',
      'Planifier l’étalonnage périodique des sondes.',
    ],
  },
  {
    match: /hygi[èe]ne|propret[ée]|nettoyage|salissure|souillure/i,
    causes: [
      'Plan de nettoyage non appliqué ou incomplet.',
      'Manque de matériel/produit ou de formation sur le poste.',
    ],
    steps: [
      'Procéder au nettoyage et à la désinfection immédiats de la zone.',
      'Vérifier la disponibilité des consommables et du matériel.',
      'Re-briefer l’équipe sur le protocole de nettoyage.',
    ],
    prevention: [
      'Afficher le plan de nettoyage et tracer chaque passage.',
      'Contrôle visuel hebdomadaire par le responsable.',
    ],
  },
  {
    match: /allerg[èe]ne|[ée]tiquet|signal[ée]tique|affichage/i,
    causes: [
      'Signalétique allergènes manquante, erronée ou non à jour.',
      'Changement de recette/fournisseur non répercuté sur l’affichage.',
    ],
    steps: [
      'Retirer ou corriger immédiatement l’affichage non conforme.',
      'Vérifier la concordance recette ↔ liste d’allergènes.',
      'Mettre à jour la signalétique sur l’ensemble des points concernés.',
    ],
    prevention: [
      'Contrôle systématique de l’étiquetage à chaque changement de recette.',
      'Double validation responsable avant mise en rayon.',
    ],
  },
  {
    match: /stock|rupture|rotation|p[ée]remption|inventaire/i,
    causes: [
      'Rotation des stocks (FEFO/FIFO) non respectée.',
      'Seuils de réapprovisionnement inadaptés.',
    ],
    steps: [
      'Retirer les produits périmés ou non conformes du rayon.',
      'Réorganiser le stock selon la règle premier périmé, premier sorti.',
      'Ajuster les seuils d’alerte de réapprovisionnement.',
    ],
    prevention: [
      'Contrôle des DLC à fréquence définie.',
      'Alertes automatiques sur les seuils de stock.',
    ],
  },
];

const GENERIC = {
  causes: [
    'Procédure non appliquée ou non connue sur le poste.',
    'Moyens insuffisants (matériel, temps, formation).',
  ],
  steps: [
    'Corriger immédiatement la situation constatée.',
    'Identifier la cause racine avec l’équipe concernée.',
    'Mettre en œuvre la correction et vérifier son efficacité.',
  ],
  prevention: [
    'Formaliser/rappeler la procédure attendue.',
    'Planifier un contrôle de suivi à court terme.',
  ],
};

/** Retire le préfixe « Non-conformité : » d'un titre d'action. */
function cleanTitle(title: string): string {
  return title.replace(/^non[- ]conformit[ée]\s*:\s*/i, '').trim();
}

/**
 * Génère un plan d'action correctif structuré à partir d'une action.
 * Déterministe (mots-clés + criticité) : fonctionne en démo, hors-ligne et
 * en ligne. Sert aussi de repli au plan généré par l'IA.
 */
export function buildLocalActionPlan(action: CorrectiveAction): ActionPlan {
  const haystack = `${action.title} ${action.description ?? ''}`;
  const theme = THEMES.find((t) => t.match.test(haystack)) ?? GENERIC;
  const subject = cleanTitle(action.title);

  return {
    summary: `Plan correctif pour « ${subject} » — priorité ${action.priority}.`,
    rootCauses: theme.causes,
    steps: theme.steps,
    prevention: theme.prevention,
    recommendedDeadlineDays: DEADLINE_BY_PRIORITY[action.priority] ?? 7,
  };
}

/** Met le plan en texte lisible (affichage, copie, partage). */
export function formatActionPlanText(plan: ActionPlan): string {
  const list = (items: string[]) =>
    items.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return [
    plan.summary,
    '',
    'CAUSES PROBABLES',
    list(plan.rootCauses),
    '',
    'ÉTAPES CORRECTIVES',
    list(plan.steps),
    '',
    'PRÉVENTION',
    list(plan.prevention),
    '',
    `Délai recommandé : ${plan.recommendedDeadlineDays} jour(s).`,
  ].join('\n');
}

/** Invite envoyée à l'assistant IA pour générer le plan en ligne. */
export function buildActionPlanPrompt(action: CorrectiveAction): string {
  return [
    "En tant qu'expert qualité/conformité en grande distribution, propose un",
    'plan d’action correctif structuré et concret pour la non-conformité',
    'suivante. Réponds en français, en sections : Causes probables, Étapes',
    'correctives (numérotées), Prévention, Délai recommandé.',
    '',
    `Non-conformité : ${action.title}`,
    action.description ? `Détail : ${action.description}` : '',
    `Priorité : ${action.priority}`,
  ]
    .filter(Boolean)
    .join('\n');
}
