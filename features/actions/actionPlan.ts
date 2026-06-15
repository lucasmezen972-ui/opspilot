import type { CorrectiveAction } from '../../lib/supabase';

export type ActionRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ActionPlan {
  /** Synthèse en une phrase. Conservé pour compatibilité UI/tests. */
  summary: string;
  /** Problème observé, reformulé en langage terrain. */
  observedProblem: string;
  /** Famille métier détectée. */
  category: string;
  /** Niveau de risque métier. */
  riskLevel: ActionRiskLevel;
  /** Causes probables identifiées. */
  rootCauses: string[];
  /** Cause probable principale, exposée dans les plans détaillés. */
  probableCause: string;
  /** Action à faire sans attendre quand le risque l'exige. */
  immediateAction: string;
  /** Action corrective principale. */
  correctiveAction: string;
  /** Mesure préventive pour éviter la récurrence. */
  preventiveAction: string;
  /** Étapes correctives, dans l'ordre. Conservé pour compatibilité. */
  steps: string[];
  /** Mesures préventives. Conservé pour compatibilité. */
  prevention: string[];
  /** Rôle recommandé pour l'assignation. */
  recommendedAssigneeRole: string;
  /** Priorité opérationnelle normalisée. */
  priority: CorrectiveAction['priority'];
  /** Libellé métier clair : immédiat, max 1h, 24h… */
  deadlineLabel: string;
  /** Date limite calculée à partir du moment de génération. */
  dueDate: string;
  /** Délai recommandé en heures pour les cas critiques/fins. */
  recommendedDeadlineHours: number;
  /** Délai recommandé en jours, conservé pour les anciens affichages. */
  recommendedDeadlineDays: number;
  /** Preuves attendues à la clôture. */
  evidenceRequired: string[];
  photoRequired: boolean;
  commentRequired: boolean;
  employeeNameRequired: boolean;
  employeeIdRequired: boolean;
  managerValidationRequired: boolean;
  escalationRequired: boolean;
  escalationTargetRole: string | null;
  checklist: string[];
  relatedProcedure: string | null;
}

interface RuleDefinition {
  id: string;
  category: string;
  match: RegExp;
  riskLevel: ActionRiskLevel;
  priority: CorrectiveAction['priority'];
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
  relatedProcedure: string | null;
}

const CRITICAL_EVIDENCE = [
  'Photo avant/après',
  "Commentaire d'exécution",
  "Nom et matricule de l'intervenant",
  'Validation manager',
];

const RULES: RuleDefinition[] = [
  {
    id: 'cold-chain',
    category: 'Chaîne du froid',
    match:
      /cha[iî]ne du froid|temp[ée]rature|chambre froide|cong[ée]lateur|r[ée]frig[ée]rateur|froid positif|froid n[ée]gatif|rupture froid/i,
    riskLevel: 'critical',
    priority: 'critical',
    deadlineHours: 1,
    deadlineLabel: 'Immédiate — maximum 1 heure',
    probableCause:
      'Rupture de chaîne du froid, équipement déréglé, porte ouverte trop longtemps ou surcharge de stockage.',
    immediateAction:
      'Isoler immédiatement les produits concernés, relever la température réelle et prévenir le manager.',
    correctiveAction:
      "Vérifier l'équipement frigorifique, consigner les relevés, décider du devenir des produits et tracer toute destruction si nécessaire.",
    preventiveAction:
      'Renforcer les relevés de température, vérifier les seuils d’alerte et rebriefer l’équipe sur la procédure froid.',
    recommendedAssigneeRole: 'Manager frais / Responsable qualité',
    evidenceRequired: [
      'Photo de la zone ou du produit concerné',
      'Relevé température horodaté',
      "Commentaire d'exécution",
      "Nom et matricule de l'intervenant",
      'Validation manager',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager / Responsable qualité',
    checklist: [
      'Bloquer les produits concernés.',
      'Relever la température réelle.',
      'Prévenir le manager.',
      'Décider du retrait, de la destruction ou de la remise en conformité.',
      'Joindre les preuves et faire valider.',
    ],
    relatedProcedure: 'Procédure chaîne du froid',
  },
  {
    id: 'expired-date',
    category: 'DLC / DDM dépassée',
    match: /\bdlc\b|\bddm\b|p[ée]rim[ée]|p[ée]remption|date d[ée]pass[ée]e?|produit expir[ée]/i,
    riskLevel: 'critical',
    priority: 'critical',
    deadlineHours: 2,
    deadlineLabel: 'Immédiate — maximum 2 heures',
    probableCause:
      'Contrôle DLC insuffisant, rotation FEFO non respectée ou alerte non traitée.',
    immediateAction:
      'Retirer immédiatement les produits concernés de la vente, les isoler et quantifier le retrait.',
    correctiveAction:
      'Tracer le retrait produit, vérifier les lots voisins et corriger la rotation en rayon/réserve.',
    preventiveAction:
      'Mettre en place un contrôle DLC renforcé et rappeler la règle FEFO à l’équipe.',
    recommendedAssigneeRole: 'Responsable rayon / Manager',
    evidenceRequired: [
      'Photo du produit et de la date',
      'Quantité retirée',
      "Commentaire d'exécution",
      "Nom et matricule de l'intervenant",
      'Validation manager',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager / Responsable qualité',
    checklist: [
      'Retirer les produits concernés.',
      'Isoler et quantifier le retrait.',
      'Contrôler les produits voisins.',
      'Corriger la rotation FEFO.',
      'Joindre photo et validation manager.',
    ],
    relatedProcedure: 'Procédure DLC / DDM',
  },
  {
    id: 'hygiene',
    category: 'Hygiène critique',
    match:
      /hygi[èe]ne|nettoyage|salissure|souillure|surface sale|d[ée]sinfection|contamination|propret[ée]/i,
    riskLevel: 'critical',
    priority: 'critical',
    deadlineHours: 2,
    deadlineLabel: 'Immédiate — maximum 2 heures',
    probableCause:
      'Plan de nettoyage non appliqué, passage oublié ou contrôle visuel insuffisant.',
    immediateAction:
      'Bloquer si nécessaire la zone concernée, nettoyer et désinfecter immédiatement avec le produit adapté.',
    correctiveAction:
      'Vérifier la conformité visuelle après nettoyage, documenter l’intervention et faire valider par le manager.',
    preventiveAction:
      'Rebriefer l’équipe sur le protocole de nettoyage et ajouter un contrôle quotidien tracé.',
    recommendedAssigneeRole: 'Responsable rayon / Manager',
    evidenceRequired: CRITICAL_EVIDENCE,
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager / Responsable qualité',
    checklist: [
      'Sécuriser ou bloquer la zone si nécessaire.',
      'Nettoyer avec le produit adapté.',
      'Désinfecter la surface concernée.',
      'Prendre une photo avant/après.',
      'Faire valider par le manager.',
    ],
    relatedProcedure: 'Plan de nettoyage et désinfection',
  },
  {
    id: 'unsafe-product',
    category: 'Produit impropre / abîmé',
    match:
      /produit ab[iî]m[ée]|produit impropre|moisissure|emballage ouvert|fuite|casse|alt[ée]r[ée]/i,
    riskLevel: 'critical',
    priority: 'critical',
    deadlineHours: 1,
    deadlineLabel: 'Immédiate',
    probableCause:
      'Produit détérioré, rupture d’emballage, défaut de contrôle réception ou mauvaise manipulation.',
    immediateAction:
      'Retirer immédiatement le produit de la vente et isoler le lot si nécessaire.',
    correctiveAction:
      'Identifier la quantité concernée, vérifier les produits similaires et tracer le retrait.',
    preventiveAction:
      'Renforcer le contrôle réception/rayon et rappeler les critères de retrait produit.',
    recommendedAssigneeRole: 'Responsable rayon / Manager',
    evidenceRequired: [
      'Photo produit',
      'Quantité concernée',
      "Commentaire d'exécution",
      'Validation manager si risque client',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager',
    checklist: [
      'Retirer le produit.',
      'Isoler le lot si nécessaire.',
      'Contrôler les produits similaires.',
      'Tracer quantité et motif.',
      'Joindre une photo.',
    ],
    relatedProcedure: 'Procédure retrait produit',
  },
  {
    id: 'people-safety',
    category: 'Sécurité client / salarié',
    match:
      /danger|accident|blessure|risque chute|sol glissant|obstacle|client|salari[ée]|issue bloqu[ée]e?/i,
    riskLevel: 'critical',
    priority: 'critical',
    deadlineHours: 1,
    deadlineLabel: 'Immédiate',
    probableCause:
      'Situation dangereuse non sécurisée, signalement tardif ou absence de balisage.',
    immediateAction:
      'Sécuriser immédiatement la zone, baliser le danger et prévenir le manager.',
    correctiveAction:
      'Supprimer le danger, vérifier l’absence de risque résiduel et tracer l’intervention.',
    preventiveAction:
      'Rappeler la procédure de signalement et ajouter un contrôle sécurité ciblé.',
    recommendedAssigneeRole: 'Manager / Référent sécurité',
    evidenceRequired: CRITICAL_EVIDENCE,
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager / Référent sécurité',
    checklist: [
      'Sécuriser la zone.',
      'Baliser ou empêcher l’accès si nécessaire.',
      'Corriger la situation.',
      'Joindre les preuves.',
      'Faire valider.',
    ],
    relatedProcedure: 'Procédure sécurité terrain',
  },
  {
    id: 'fire-safety',
    category: 'Sécurité incendie',
    match: /incendie|extincteur|alarme|signal[ée]tique|issue de secours|[ée]vacuation/i,
    riskLevel: 'critical',
    priority: 'critical',
    deadlineHours: 1,
    deadlineLabel: 'Immédiate à 24 heures selon gravité',
    probableCause:
      'Équipement de sécurité inaccessible, signalétique absente ou contrôle périodique insuffisant.',
    immediateAction:
      'Libérer immédiatement tout accès bloqué aux équipements ou issues de secours.',
    correctiveAction:
      'Remettre en conformité l’élément signalé et documenter la correction avant validation manager.',
    preventiveAction:
      'Planifier un contrôle sécurité incendie récurrent et sensibiliser l’équipe.',
    recommendedAssigneeRole: 'Manager / Référent sécurité',
    evidenceRequired: [
      'Photo avant/après',
      "Commentaire d'exécution",
      'Validation manager',
    ],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: true,
    employeeIdRequired: true,
    managerValidationRequired: true,
    escalationRequired: true,
    escalationTargetRole: 'Manager / Référent sécurité',
    checklist: [
      'Identifier la gravité.',
      'Corriger immédiatement si accès bloqué.',
      'Documenter la correction.',
      'Vérifier l’absence de risque résiduel.',
      'Faire valider.',
    ],
    relatedProcedure: 'Procédure sécurité incendie',
  },
  {
    id: 'price-display',
    category: 'Affichage prix / balisage',
    match: /prix|[ée]tiquette|balisage|affichage|promo|promotion/i,
    riskLevel: 'medium',
    priority: 'high',
    deadlineHours: 24,
    deadlineLabel: 'Sous 24 heures',
    probableCause:
      'Étiquette non mise à jour, promotion mal relayée ou contrôle prix insuffisant.',
    immediateAction:
      'Vérifier la cohérence prix rayon/caisse et corriger l’affichage concerné.',
    correctiveAction:
      'Mettre à jour l’étiquette ou le balisage, puis contrôler les références proches.',
    preventiveAction:
      'Ajouter un contrôle prix lors des changements promotionnels et en ouverture.',
    recommendedAssigneeRole: 'Responsable rayon / Employé commercial',
    evidenceRequired: ['Photo de l’étiquette corrigée', "Commentaire d'exécution"],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: false,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Identifier la référence.',
      'Vérifier le prix caisse/rayon.',
      'Corriger l’étiquette.',
      'Prendre une photo après correction.',
    ],
    relatedProcedure: 'Procédure affichage prix',
  },
  {
    id: 'merchandising',
    category: 'Facing / merchandising',
    match: /facing|rayon d[ée]sordonn[ée]|pr[ée]sentation|merchandising|rupture visuelle/i,
    riskLevel: 'low',
    priority: 'medium',
    deadlineHours: 48,
    deadlineLabel: 'Sous 48 heures',
    probableCause:
      'Réassort ou facing non réalisé, priorisation terrain insuffisante.',
    immediateAction:
      'Remettre en état les zones les plus visibles ou génératrices de rupture client.',
    correctiveAction:
      'Reprendre la présentation du rayon et vérifier le stock disponible.',
    preventiveAction:
      'Planifier un contrôle facing régulier sur les créneaux forts.',
    recommendedAssigneeRole: 'Employé rayon / Manager',
    evidenceRequired: ['Photo après correction', "Commentaire d'exécution"],
    photoRequired: true,
    commentRequired: true,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: false,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Identifier la zone.',
      'Reprendre la présentation.',
      'Vérifier le stock disponible.',
      'Joindre une photo après correction.',
    ],
    relatedProcedure: 'Procédure merchandising / facing',
  },
  {
    id: 'stock-rotation',
    category: 'Stock / rotation',
    match: /stock|rotation|fifo|fefo|r[ée]serve|inventaire|rupture/i,
    riskLevel: 'medium',
    priority: 'medium',
    deadlineHours: 48,
    deadlineLabel: 'Sous 48 heures',
    probableCause:
      'Rotation non respectée, stock réserve mal organisé ou seuil d’alerte inadapté.',
    immediateAction:
      'Contrôler les références concernées et sécuriser les produits à risque.',
    correctiveAction:
      'Réorganiser le stock selon FEFO/FIFO et mettre à jour les quantités.',
    preventiveAction:
      'Mettre en place un contrôle récurrent stock/rotation.',
    recommendedAssigneeRole: 'Responsable rayon / Gestionnaire stock',
    evidenceRequired: ["Commentaire d'exécution", 'Photo si nécessaire'],
    photoRequired: false,
    commentRequired: true,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: false,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Contrôler les références concernées.',
      'Corriger la rotation.',
      'Mettre à jour le stock.',
      'Documenter la correction.',
    ],
    relatedProcedure: 'Procédure stock et rotation',
  },
  {
    id: 'training-gap',
    category: 'Formation manquante',
    match: /formation|habilitation|comp[ée]tence|proc[ée]dure non connue|non form[ée]/i,
    riskLevel: 'medium',
    priority: 'medium',
    deadlineHours: 24 * 7,
    deadlineLabel: 'Sous 7 jours',
    probableCause:
      'Formation non assignée, nouvel arrivant non intégré ou procédure insuffisamment connue.',
    immediateAction:
      'Assigner la formation obligatoire au collaborateur concerné.',
    correctiveAction:
      'Faire réaliser la formation et vérifier la compréhension via l’évaluation.',
    preventiveAction:
      'Ajouter cette formation au parcours d’intégration ou au plan de recyclage.',
    recommendedAssigneeRole: 'Manager / Superviseur formation',
    evidenceRequired: ['Attestation de formation terminée', 'Score de validation'],
    photoRequired: false,
    commentRequired: true,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: true,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Assigner la formation.',
      'Suivre la progression.',
      'Vérifier le score.',
      'Archiver l’attestation.',
    ],
    relatedProcedure: 'Parcours formation interne',
  },
  {
    id: 'management',
    category: 'Management / organisation',
    match: /briefing|planning|recadrage|[ée]quipe|organisation|management|conflit/i,
    riskLevel: 'medium',
    priority: 'medium',
    deadlineHours: 24 * 5,
    deadlineLabel: 'Sous 3 à 7 jours',
    probableCause:
      'Consigne managériale incomplète, suivi insuffisant ou organisation de poste à clarifier.',
    immediateAction:
      'Clarifier la consigne auprès de l’équipe ou du collaborateur concerné.',
    correctiveAction:
      'Organiser un point manager, formaliser les attendus et planifier un suivi.',
    preventiveAction:
      'Intégrer le sujet au briefing et au rituel de pilotage hebdomadaire.',
    recommendedAssigneeRole: 'Manager',
    evidenceRequired: ['Commentaire manager', 'Plan de suivi si nécessaire'],
    photoRequired: false,
    commentRequired: true,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: true,
    escalationRequired: false,
    escalationTargetRole: null,
    checklist: [
      'Clarifier le problème.',
      'Réaliser un point manager.',
      'Formaliser les attendus.',
      'Planifier un suivi.',
    ],
    relatedProcedure: 'Rituel management opérationnel',
  },
];

const GENERIC_RULE: RuleDefinition = {
  id: 'generic',
  category: 'Non-conformité opérationnelle',
  match: /.*/,
  riskLevel: 'medium',
  priority: 'medium',
  deadlineHours: 48,
  deadlineLabel: 'Sous 48 heures',
  probableCause:
    'Procédure non appliquée, moyen insuffisant ou manque de clarification sur le poste.',
  immediateAction:
    'Corriger la situation constatée et sécuriser le point si un risque est identifié.',
  correctiveAction:
    'Identifier la cause racine avec l’équipe concernée, mettre en œuvre la correction et vérifier son efficacité.',
  preventiveAction:
    'Formaliser ou rappeler la procédure attendue et planifier un contrôle de suivi.',
  recommendedAssigneeRole: 'Manager / Responsable opérationnel',
  evidenceRequired: ["Commentaire d'exécution", 'Photo si nécessaire'],
  photoRequired: false,
  commentRequired: true,
  employeeNameRequired: false,
  employeeIdRequired: false,
  managerValidationRequired: false,
  escalationRequired: false,
  escalationTargetRole: null,
  checklist: [
    'Qualifier la non-conformité.',
    'Corriger la situation.',
    'Documenter la correction.',
    'Vérifier l’efficacité.',
  ],
  relatedProcedure: null,
};

/** Retire le préfixe « Non-conformité : » d'un titre d'action. */
function cleanTitle(title: string): string {
  return title.replace(/^non[- ]conformit[ée]\s*:\s*/i, '').trim();
}

function addHours(date: Date, hours: number): string {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function matchesRule(rule: RuleDefinition, haystack: string): boolean {
  rule.match.lastIndex = 0;
  return rule.match.test(haystack);
}

function selectRule(action: CorrectiveAction): RuleDefinition {
  const haystack = `${action.title} ${action.description ?? ''}`;
  return RULES.find((rule) => matchesRule(rule, haystack)) ?? GENERIC_RULE;
}

/**
 * Génère un plan d'action correctif structuré à partir d'une action ou d'une
 * non-conformité. La logique est déterministe (mots-clés + matrice métier) :
 * elle fonctionne en démo, hors-ligne et comme garde-fou de l'IA en ligne.
 */
export function generateCorrectiveActionPlan(
  action: CorrectiveAction,
  now = new Date(),
): ActionPlan {
  const rule = selectRule(action);
  const subject = cleanTitle(action.title);
  const observedProblem = action.description?.trim() || subject;
  const priority =
    action.priority === 'critical' || rule.priority === 'critical'
      ? 'critical'
      : rule.priority;
  const recommendedDeadlineDays = Math.max(
    1,
    Math.ceil(rule.deadlineHours / 24),
  );

  return {
    summary: `Plan correctif pour « ${subject} » — ${rule.deadlineLabel}.`,
    observedProblem,
    category: rule.category,
    riskLevel: rule.riskLevel,
    rootCauses: [rule.probableCause],
    probableCause: rule.probableCause,
    immediateAction: rule.immediateAction,
    correctiveAction: rule.correctiveAction,
    preventiveAction: rule.preventiveAction,
    steps: [rule.immediateAction, rule.correctiveAction],
    prevention: [rule.preventiveAction],
    recommendedAssigneeRole: rule.recommendedAssigneeRole,
    priority,
    deadlineLabel: rule.deadlineLabel,
    dueDate: addHours(now, rule.deadlineHours),
    recommendedDeadlineHours: rule.deadlineHours,
    recommendedDeadlineDays,
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

/**
 * Ancien nom conservé pour compatibilité avec l'écran Actions et les tests.
 */
export function buildLocalActionPlan(action: CorrectiveAction): ActionPlan {
  return generateCorrectiveActionPlan(action);
}

/** Met le plan en texte lisible (affichage, copie, partage). */
export function formatActionPlanText(plan: ActionPlan): string {
  const list = (items: string[]) =>
    items.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const yesNo = (value: boolean) => (value ? 'Oui' : 'Non');
  const requiredFields = [
    plan.photoRequired ? 'photo' : null,
    plan.commentRequired ? 'commentaire' : null,
    plan.employeeNameRequired ? 'nom exécutant' : null,
    plan.employeeIdRequired ? 'matricule' : null,
    plan.managerValidationRequired ? 'validation manager' : null,
  ].filter(Boolean);

  return [
    plan.summary,
    '',
    'PROBLÈME CONSTATÉ',
    plan.observedProblem,
    '',
    'CATÉGORIE / RISQUE',
    `${plan.category} — risque ${plan.riskLevel}`,
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
    'DEADLINE',
    `${plan.deadlineLabel} (échéance calculée : ${new Date(plan.dueDate).toLocaleString('fr-FR')})`,
    '',
    'RESPONSABLE RECOMMANDÉ',
    plan.recommendedAssigneeRole,
    '',
    'PREUVES ATTENDUES',
    list(plan.evidenceRequired),
    '',
    'OBLIGATIONS DE CLÔTURE',
    requiredFields.length > 0
      ? requiredFields.join(', ')
      : 'Commentaire recommandé selon contexte.',
    `Escalade manager : ${yesNo(plan.escalationRequired)}`,
    plan.escalationTargetRole ? `Cible escalade : ${plan.escalationTargetRole}` : '',
    '',
    'CHECKLIST',
    list(plan.checklist),
    '',
    plan.relatedProcedure ? `PROCÉDURE ASSOCIÉE\n${plan.relatedProcedure}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/** Invite envoyée à l'assistant IA pour générer le plan en ligne. */
export function buildActionPlanPrompt(action: CorrectiveAction): string {
  const plan = generateCorrectiveActionPlan(action);
  return [
    "En tant qu'expert qualité/conformité en grande distribution, propose un",
    "plan d’action correctif structuré et concret pour la non-conformité suivante.",
    'Tu dois respecter STRICTEMENT la matrice métier OpsPilot ci-dessous.',
    "N'invente pas de règle légale et ne donne pas de conseil juridique définitif.",
    'Si le problème est critique, ne propose jamais une deadline longue.',
    '',
    `Non-conformité : ${action.title}`,
    action.description ? `Détail : ${action.description}` : '',
    `Priorité actuelle : ${action.priority}`,
    '',
    'PLAN MÉTIER À RESPECTER',
    `Catégorie : ${plan.category}`,
    `Risque : ${plan.riskLevel}`,
    `Deadline imposée : ${plan.deadlineLabel}`,
    `Preuves attendues : ${plan.evidenceRequired.join(', ')}`,
    `Validation manager obligatoire : ${plan.managerValidationRequired ? 'oui' : 'non'}`,
    `Escalade obligatoire : ${plan.escalationRequired ? 'oui' : 'non'}`,
    '',
    'Réponds en français avec les sections : Problème constaté, Cause probable,',
    'Action immédiate, Action corrective, Action préventive, Deadline, Preuves',
    'attendues, Checklist et Validation.',
  ]
    .filter(Boolean)
    .join('\n');
}
