import type { CorrectiveAction } from '../../lib/supabase';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

/** Entrée minimale acceptée : une action corrective ou une non-conformité brute. */
export interface CorrectiveActionInput {
  title: string;
  description?: string | null;
  priority?: CorrectiveAction['priority'];
}

/**
 * Plan d'action correctif structuré, calibré selon le problème *détecté*
 * (et non la seule priorité). Pensé pour un usage terrain en distribution /
 * restauration / franchise : délai, preuves attendues et validation requise
 * dépendent de la nature du risque.
 */
export interface CorrectiveActionPlan {
  title: string;
  /** Reformulation du problème constaté. */
  observedProblem: string;
  /** Famille de non-conformité détectée. */
  category: string;
  riskLevel: RiskLevel;
  probableCause: string;
  immediateAction: string;
  correctiveAction: string;
  preventiveAction: string;
  /** Rôle le plus pertinent pour traiter l'action. */
  recommendedAssigneeRole: string;
  priority: CorrectiveAction['priority'];
  /** Délai maximum exprimé en heures (sert au calcul de l'échéance). */
  deadlineHours: number;
  deadlineLabel: string;
  /** Échéance absolue calculée (ISO). */
  dueDate: string;
  /** Preuves attendues à la clôture (liste lisible). */
  evidenceRequired: string[];
  photoRequired: boolean;
  commentRequired: boolean;
  employeeNameRequired: boolean;
  employeeIdRequired: boolean;
  managerValidationRequired: boolean;
  escalationRequired: boolean;
  escalationTargetRole: string | null;
  checklist: string[];
  relatedProcedure: string;
}

/**
 * Modèle d'une famille de non-conformité. L'IA reste *encadrée* : elle ne fait
 * que sélectionner un modèle métier pré-validé (jamais de règle légale inventée,
 * jamais de délai long sur un risque critique).
 */
interface CategoryRule {
  id: string;
  category: string;
  match: RegExp;
  riskLevel: RiskLevel;
  deadlineHours: number;
  deadlineLabel: string;
  probableCause: string;
  immediateAction: string;
  correctiveAction: string;
  preventiveAction: string;
  recommendedAssigneeRole: string;
  evidenceRequired: string[];
  photoRequired: boolean;
  commentRequired: boolean;
  employeeNameRequired: boolean;
  employeeIdRequired: boolean;
  managerValidationRequired: boolean;
  escalationRequired: boolean;
  escalationTargetRole: string | null;
  checklist: string[];
  relatedProcedure: string;
}

/**
 * Matrice des familles, ordonnée du risque le plus grave au plus faible.
 * Le premier modèle dont les mots-clés correspondent est retenu — l'ordre
 * garantit qu'un signal critique (froid, hygiène, sécurité) prime toujours.
 */
const CATEGORY_RULES: CategoryRule[] = [
  {
    id: 'cold_chain',
    category: 'Chaîne du froid',
    match:
      /cha[îi]ne du froid|chambre froide|cong[ée]lateur|r[ée]frig[ée]rateur|rupture (?:de )?froid|temp[ée]rature|\bfroid\b/i,
    riskLevel: 'critical',
    deadlineHours: 1,
    deadlineLabel: 'Sous 1 heure',
    probableCause:
      'Rupture de la chaîne du froid : équipement défaillant, porte restée ouverte, surcharge ou sonde déréglée.',
    immediateAction:
      'Relever immédiatement la température réelle, isoler les produits sensibles et ne rien remettre en vente avant décision.',
    correctiveAction:
      'Faire intervenir la maintenance sur l’équipement, statuer sur le devenir des produits (destruction tracée si sécurité compromise) et consigner le relevé.',
    preventiveAction:
      'Mettre en place un relevé de température biquotidien tracé et planifier l’étalonnage périodique des sondes.',
    recommendedAssigneeRole: 'Responsable de rayon frais / manager',
    evidenceRequired: [
      'Preuve photo de l’équipement et de l’affichage de température',
      'Relevé de température daté et signé',
      'Commentaire sur la décision produits',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager / Direction qualité',
    checklist: [
      'Température réelle relevée et consignée',
      'Produits sensibles isolés',
      'Maintenance équipement déclenchée',
      'Décision sur les produits tracée',
    ],
    relatedProcedure: 'Procédure HACCP — maîtrise de la chaîne du froid',
  },
  {
    id: 'hygiene',
    category: 'Hygiène critique',
    match:
      /hygi[èe]ne|nettoyage|salissure|souillure|surface sale|sale\b|d[ée]sinfection|contamination/i,
    riskLevel: 'critical',
    deadlineHours: 2,
    deadlineLabel: 'Sous 2 heures',
    probableCause:
      'Plan de nettoyage non appliqué, manque de matériel/produit ou geste d’hygiène non respecté sur le poste.',
    immediateAction:
      'Nettoyer et désinfecter sans délai la zone concernée, retirer tout produit potentiellement exposé.',
    correctiveAction:
      'Vérifier la disponibilité des consommables, re-briefer l’équipe sur le protocole et contrôler le résultat.',
    preventiveAction:
      'Afficher le plan de nettoyage, tracer chaque passage et planifier un contrôle visuel hebdomadaire du responsable.',
    recommendedAssigneeRole: 'Employé du rayon concerné + validation manager',
    evidenceRequired: [
      'Preuve photo avant / après nettoyage',
      'Commentaire décrivant l’action réalisée',
      'Nom et matricule de l’intervenant',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager / Référent hygiène',
    checklist: [
      'Zone nettoyée et désinfectée',
      'Produits exposés retirés',
      'Consommables réapprovisionnés',
      'Équipe re-briefée',
    ],
    relatedProcedure: 'Plan de Maîtrise Sanitaire — nettoyage / désinfection',
  },
  {
    id: 'expiry',
    category: 'DLC / DDM',
    match:
      /\bdlc\b|\bddm\b|p[ée]rim[ée]|p[ée]remption|date d[ée]pass[ée]e|produit expir[ée]|expir[ée]/i,
    riskLevel: 'critical',
    deadlineHours: 2,
    deadlineLabel: 'Sous 2 heures',
    probableCause:
      'Rotation des stocks (FEFO) non respectée ou contrôle des dates non réalisé sur le rayon.',
    immediateAction:
      'Retirer immédiatement les produits concernés de la vente, les isoler et quantifier précisément les références touchées.',
    correctiveAction:
      'Tracer la destruction / le retrait, réorganiser le rayon selon la règle premier périmé-premier sorti et corriger l’affichage.',
    preventiveAction:
      'Mettre en place un contrôle des DLC à fréquence définie et des alertes de rotation.',
    recommendedAssigneeRole: 'Responsable de rayon',
    evidenceRequired: [
      'Preuve photo des produits et de leurs dates',
      'Quantité retirée renseignée',
      'Commentaire sur le devenir des produits',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Produits périmés retirés de la vente',
      'Quantité quantifiée',
      'Retrait / destruction tracé',
      'Rotation du rayon corrigée',
    ],
    relatedProcedure: 'Procédure de gestion des DLC / DDM (FEFO)',
  },
  {
    id: 'fire_safety',
    category: 'Sécurité incendie',
    match:
      /issue de secours bloqu[ée]e|issue de secours|sortie de secours|extincteur|incendie|alarme|d[ée]senfumage|signal[ée]tique de s[ée]curit[ée]/i,
    riskLevel: 'critical',
    deadlineHours: 1,
    deadlineLabel: 'Immédiat (sécurité des personnes)',
    probableCause:
      'Dégagement de secours obstrué ou moyen de secours rendu inaccessible / inopérant.',
    immediateAction:
      'Libérer sans délai l’issue ou rendre le moyen de secours accessible ; sécuriser la zone et prévenir le responsable.',
    correctiveAction:
      'Identifier la cause de l’obstruction, rétablir la conformité et vérifier l’ensemble des dégagements du site.',
    preventiveAction:
      'Matérialiser au sol les zones à ne jamais encombrer et intégrer un contrôle des issues à l’ouverture / fermeture.',
    recommendedAssigneeRole: 'Manager / Responsable sécurité',
    evidenceRequired: [
      'Preuve photo avant / après mise en conformité',
      'Commentaire sur la cause et la remise en état',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: false,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager / Direction sécurité',
    checklist: [
      'Issue / moyen de secours rendu accessible',
      'Zone sécurisée',
      'Cause de l’obstruction traitée',
      'Autres dégagements vérifiés',
    ],
    relatedProcedure: 'Registre de sécurité — dégagements et moyens de secours',
  },
  {
    id: 'people_safety',
    category: 'Sécurité client / salarié',
    match:
      /danger|accident|blessure|chute|obstacle|sol glissant|glissant|bless[ée]|risque de chute|issue bloqu[ée]e/i,
    riskLevel: 'critical',
    deadlineHours: 1,
    deadlineLabel: 'Immédiat (risque de blessure)',
    probableCause:
      'Situation dangereuse pour les personnes : sol glissant, obstacle, zone non sécurisée ou matériel défaillant.',
    immediateAction:
      'Sécuriser et baliser immédiatement la zone, supprimer le danger et prévenir le manager.',
    correctiveAction:
      'Traiter la cause (nettoyage, réparation, retrait), documenter l’incident et vérifier l’absence de risque résiduel.',
    preventiveAction:
      'Renforcer les contrôles de la zone et rappeler les consignes de sécurité à l’équipe.',
    recommendedAssigneeRole: 'Manager / Responsable du secteur',
    evidenceRequired: [
      'Preuve photo de la zone sécurisée',
      'Commentaire décrivant le danger et le traitement',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: false,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager / Direction',
    checklist: [
      'Zone balisée et sécurisée',
      'Danger supprimé',
      'Incident documenté',
      'Risque résiduel vérifié',
    ],
    relatedProcedure:
      'Procédure de prévention des risques — sécurité des personnes',
  },
  {
    id: 'damaged_product',
    category: 'Produit impropre',
    match:
      /ab[îi]m[ée]|moisissure|emballage ouvert|fuite|casse|cass[ée]|d[ée]t[ée]rior[ée]/i,
    riskLevel: 'high',
    deadlineHours: 2,
    deadlineLabel: 'Sous 2 heures',
    probableCause:
      'Produit détérioré, emballage compromis ou casse non détectée lors des contrôles rayon.',
    immediateAction:
      'Retirer le produit de la vente et l’isoler pour éviter toute confusion avec le stock conforme.',
    correctiveAction:
      'Tracer le retrait, vérifier les produits voisins et signaler au fournisseur si défaut récurrent.',
    preventiveAction:
      'Renforcer le contrôle visuel à la mise en rayon et au réassort.',
    recommendedAssigneeRole: 'Employé du rayon concerné',
    evidenceRequired: [
      'Preuve photo du produit impropre',
      'Commentaire sur la quantité et le devenir',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: false,
    managerValidationRequired: false,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Produit retiré et isolé',
      'Produits voisins vérifiés',
      'Retrait tracé',
    ],
    relatedProcedure: 'Procédure retrait produit non conforme',
  },
  {
    id: 'pricing',
    category: 'Affichage prix',
    match: /\bprix\b|[ée]tiquet|balisage|affichage|promo|promotion/i,
    riskLevel: 'high',
    deadlineHours: 24,
    deadlineLabel: 'Sous 24 heures',
    probableCause:
      'Étiquette / balisage manquant, erroné ou non mis à jour après changement de prix ou de promotion.',
    immediateAction:
      'Corriger ou retirer immédiatement l’affichage erroné pour éviter toute information trompeuse.',
    correctiveAction:
      'Vérifier la concordance prix caisse ↔ rayon et mettre à jour l’ensemble des points concernés.',
    preventiveAction:
      'Systématiser le contrôle d’étiquetage à chaque changement de prix et la double validation avant mise en rayon.',
    recommendedAssigneeRole: 'Responsable de rayon',
    evidenceRequired: [
      'Preuve photo de l’étiquette corrigée',
      'Commentaire sur la correction apportée',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: false,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Affichage erroné corrigé',
      'Concordance prix caisse / rayon vérifiée',
      'Points concernés mis à jour',
    ],
    relatedProcedure: 'Procédure information consommateur — affichage des prix',
  },
  {
    id: 'stock',
    category: 'Stock / rotation',
    match: /stock|rotation|\bfifo\b|\bfefo\b|r[ée]serve|inventaire|rupture/i,
    riskLevel: 'medium',
    deadlineHours: 48,
    deadlineLabel: 'Sous 48 heures',
    probableCause:
      'Rotation des stocks non respectée, seuils de réapprovisionnement inadaptés ou réserve désorganisée.',
    immediateAction:
      'Réorganiser le stock selon la règle premier périmé-premier sorti et identifier les ruptures.',
    correctiveAction:
      'Ajuster les seuils d’alerte de réapprovisionnement et fiabiliser l’inventaire concerné.',
    preventiveAction:
      'Mettre en place des alertes automatiques sur les seuils et un contrôle de rotation régulier.',
    recommendedAssigneeRole: 'Responsable de rayon / réserve',
    evidenceRequired: [
      'Preuve photo de la réserve / du rayon réorganisé',
      'Commentaire sur les références concernées',
    ],
    photoRequired: true,
    commentRequired: false,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: false,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Stock réorganisé (FEFO/FIFO)',
      'Ruptures identifiées',
      'Seuils ajustés',
    ],
    relatedProcedure: 'Procédure de gestion des stocks et réassort',
  },
  {
    id: 'merchandising',
    category: 'Facing / merchandising',
    match:
      /facing|rayon d[ée]sordonn[ée]|pr[ée]sentation|merchandising|d[ée]sordonn[ée]/i,
    riskLevel: 'low',
    deadlineHours: 48,
    deadlineLabel: 'Sous 48 heures',
    probableCause:
      'Facing non réalisé ou rayon désordonné nuisant à la présentation et à la disponibilité perçue.',
    immediateAction:
      'Remettre le rayon en ordre et réaliser le facing des produits concernés.',
    correctiveAction:
      'Vérifier le plan merchandising et combler les trous de gamme.',
    preventiveAction:
      'Intégrer un passage facing aux routines d’ouverture et de fermeture.',
    recommendedAssigneeRole: 'Employé du rayon concerné',
    evidenceRequired: ['Preuve photo du rayon après remise en ordre'],
    photoRequired: true,
    commentRequired: false,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: false,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Rayon remis en ordre',
      'Facing réalisé',
      'Trous de gamme comblés',
    ],
    relatedProcedure: 'Guide merchandising — tenue des rayons',
  },
  {
    id: 'training',
    category: 'Formation manquante',
    match: /formation|habilitation|comp[ée]tence|attestation/i,
    riskLevel: 'medium',
    deadlineHours: 24 * 7,
    deadlineLabel: 'Sous 7 jours',
    probableCause:
      'Collaborateur non formé ou habilitation expirée sur une tâche réglementée ou sensible.',
    immediateAction:
      'Restreindre la tâche aux personnes habilitées en attendant la mise à niveau.',
    correctiveAction:
      'Planifier et réaliser la formation / habilitation requise, puis tracer l’attestation.',
    preventiveAction:
      'Tenir à jour la matrice des compétences et anticiper les renouvellements.',
    recommendedAssigneeRole: 'Manager / Référent formation',
    evidenceRequired: ['Attestation de formation', 'Commentaire de suivi'],
    photoRequired: false,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Tâche restreinte aux habilités',
      'Formation planifiée',
      'Attestation enregistrée',
    ],
    relatedProcedure: 'Plan de formation et matrice des compétences',
  },
  {
    id: 'management',
    category: 'Management',
    match: /briefing|planning|recadrage|[ée]quipe|organisation|management/i,
    riskLevel: 'medium',
    deadlineHours: 24 * 5,
    deadlineLabel: 'Sous 3 à 7 jours',
    probableCause:
      'Organisation, briefing ou suivi d’équipe insuffisant sur le périmètre concerné.',
    immediateAction:
      'Clarifier l’attendu avec l’équipe et désigner un responsable du suivi.',
    correctiveAction:
      'Mettre en place le rituel manquant (briefing, planning) et formaliser le point de suivi.',
    preventiveAction:
      'Ancrer le rituel dans la routine managériale et en suivre l’application.',
    recommendedAssigneeRole: 'Manager',
    evidenceRequired: ['Commentaire manager sur l’action menée'],
    photoRequired: false,
    commentRequired: true,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: true,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Attendu clarifié avec l’équipe',
      'Rituel mis en place',
      'Point de suivi planifié',
    ],
    relatedProcedure: 'Routine managériale — animation d’équipe',
  },
];

/**
 * Modèle de repli (cas inconnu). Délai prudent par défaut ; relevé si le texte
 * porte un signal critique non capté par les familles ci-dessus.
 */
const FALLBACK_RULE: CategoryRule = {
  id: 'generic',
  category: 'Non-conformité à qualifier',
  match: /.*/,
  riskLevel: 'medium',
  deadlineHours: 48,
  deadlineLabel: 'Sous 48 heures',
  probableCause:
    'Procédure non appliquée ou non connue sur le poste, moyens insuffisants (matériel, temps, formation).',
  immediateAction:
    'Corriger immédiatement la situation constatée et sécuriser le périmètre si besoin.',
  correctiveAction:
    'Identifier la cause racine avec l’équipe concernée, mettre en œuvre la correction et vérifier son efficacité.',
  preventiveAction:
    'Formaliser ou rappeler la procédure attendue et planifier un contrôle de suivi à court terme.',
  recommendedAssigneeRole: 'Responsable du secteur concerné',
  evidenceRequired: ['Commentaire décrivant l’action réalisée'],
  photoRequired: false,
  commentRequired: true,
  employeeNameRequired: false,
  employeeIdRequired: false,
  managerValidationRequired: false,
  escalationRequired: false,
  escalationTargetRole: null,
  checklist: [
    'Situation corrigée',
    'Cause racine identifiée',
    'Efficacité vérifiée',
  ],
  relatedProcedure: 'Procédure générale de traitement des non-conformités',
};

/**
 * Signaux critiques : si un cas inconnu les contient, on applique la règle la
 * plus prudente plutôt que le repli médian (principe de précaution).
 */
const CRITICAL_GUARD =
  /hygi[èe]ne|froid|\bdlc\b|s[ée]curit[ée]|danger|client|salari[ée]/i;

function selectRule(haystack: string): CategoryRule {
  const matched = CATEGORY_RULES.find((rule) => rule.match.test(haystack));
  if (matched) return matched;
  if (CRITICAL_GUARD.test(haystack)) {
    return {
      ...FALLBACK_RULE,
      category: 'Non-conformité à qualifier (signal critique)',
      riskLevel: 'critical',
      deadlineHours: 2,
      deadlineLabel: 'Sous 2 heures (par précaution)',
      immediateAction:
        'Traiter sans délai par précaution : sécuriser, isoler ce qui doit l’être et alerter le manager.',
      photoRequired: true,
      commentRequired: true,
      managerValidationRequired: true,
    };
  }
  return FALLBACK_RULE;
}

const RISK_TO_PRIORITY: Record<RiskLevel, CorrectiveAction['priority']> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

/** Retire le préfixe « Non-conformité : » d'un titre d'action. */
function cleanTitle(title: string): string {
  return title.replace(/^non[- ]conformit[ée]\s*:\s*/i, '').trim();
}

/**
 * Génère un plan d'action correctif structuré à partir d'une action ou d'une
 * non-conformité. Le délai et les preuves dépendent du **problème détecté**
 * (matrice de mots-clés), pas seulement de la priorité saisie. Déterministe :
 * fonctionne en démo, hors-ligne et en ligne ; sert de repli au plan IA.
 *
 * @param now base de calcul de l'échéance (injectable pour les tests).
 */
export function generateCorrectiveActionPlan(
  input: CorrectiveActionInput,
  now: Date = new Date(),
): CorrectiveActionPlan {
  const haystack = `${input.title} ${input.description ?? ''}`;
  const rule = selectRule(haystack);
  const subject = cleanTitle(input.title);
  const dueDate = new Date(
    now.getTime() + rule.deadlineHours * 60 * 60 * 1000,
  ).toISOString();

  return {
    title: `Plan d’action correctif — ${subject}`,
    observedProblem: subject,
    category: rule.category,
    riskLevel: rule.riskLevel,
    probableCause: rule.probableCause,
    immediateAction: rule.immediateAction,
    correctiveAction: rule.correctiveAction,
    preventiveAction: rule.preventiveAction,
    recommendedAssigneeRole: rule.recommendedAssigneeRole,
    priority: RISK_TO_PRIORITY[rule.riskLevel],
    deadlineHours: rule.deadlineHours,
    deadlineLabel: rule.deadlineLabel,
    dueDate,
    evidenceRequired: rule.evidenceRequired,
    photoRequired: rule.photoRequired,
    commentRequired: rule.commentRequired,
    employeeNameRequired: rule.employeeNameRequired,
    employeeIdRequired: rule.employeeIdRequired,
    managerValidationRequired: rule.managerValidationRequired,
    escalationRequired: rule.escalationRequired,
    escalationTargetRole: rule.escalationTargetRole,
    checklist: rule.checklist,
    relatedProcedure: rule.relatedProcedure,
  };
}

const RISK_LABELS: Record<RiskLevel, string> = {
  critical: 'Critique',
  high: 'Élevé',
  medium: 'Modéré',
  low: 'Faible',
};

/** Libellé lisible du niveau de risque. */
export function riskLevelLabel(level: RiskLevel): string {
  return RISK_LABELS[level];
}

/** Met le plan en texte lisible (affichage, copie, partage, repli IA). */
export function formatCorrectiveActionPlanText(
  plan: CorrectiveActionPlan,
): string {
  const list = (items: string[]) => items.map((s) => `• ${s}`).join('\n');
  const validations = [
    plan.photoRequired && 'Preuve photo',
    plan.commentRequired && 'Commentaire',
    plan.employeeNameRequired && 'Nom de l’intervenant',
    plan.employeeIdRequired && 'Matricule',
    plan.managerValidationRequired && 'Validation manager',
    plan.escalationRequired &&
      `Escalade${plan.escalationTargetRole ? ` → ${plan.escalationTargetRole}` : ''}`,
  ].filter(Boolean) as string[];

  return [
    `PROBLÈME CONSTATÉ : ${plan.observedProblem}`,
    `Catégorie : ${plan.category}`,
    `Niveau de risque : ${riskLevelLabel(plan.riskLevel)}`,
    `Délai de traitement : ${plan.deadlineLabel}`,
    '',
    'CAUSE PROBABLE',
    plan.probableCause,
    '',
    'ACTION IMMÉDIATE',
    plan.immediateAction,
    '',
    'ACTION CORRECTIVE',
    plan.correctiveAction,
    '',
    'ACTION PRÉVENTIVE',
    plan.preventiveAction,
    '',
    'PREUVES ATTENDUES',
    list(plan.evidenceRequired),
    '',
    'CHECKLIST DE CLÔTURE',
    list(plan.checklist),
    '',
    `VALIDATION REQUISE : ${validations.length ? validations.join(' · ') : 'Aucune obligation spécifique'}`,
    `RESPONSABLE RECOMMANDÉ : ${plan.recommendedAssigneeRole}`,
    `PROCÉDURE LIÉE : ${plan.relatedProcedure}`,
  ].join('\n');
}

/** Invite envoyée à l'assistant IA pour générer le plan en ligne. */
export function buildActionPlanPrompt(input: CorrectiveActionInput): string {
  const reference = generateCorrectiveActionPlan(input);
  return [
    "En tant qu'expert qualité/conformité en grande distribution, propose un",
    'plan d’action correctif structuré et concret pour la non-conformité',
    'suivante. Réponds en français, en sections : Problème constaté, Niveau de',
    'risque, Cause probable, Action immédiate, Action corrective, Action',
    'préventive, Preuves attendues, Délai recommandé. N’invente aucune règle',
    'légale ; ne propose jamais de délai long pour un risque critique ; exige',
    'une validation manager pour tout risque critique.',
    '',
    `Non-conformité : ${input.title}`,
    input.description ? `Détail : ${input.description}` : '',
    `Famille détectée : ${reference.category} (risque ${riskLevelLabel(reference.riskLevel)})`,
    `Délai maximum attendu : ${reference.deadlineLabel}`,
  ]
    .filter(Boolean)
    .join('\n');
}
