import type { CorrectiveAction } from '../../lib/supabase';

export type ActionRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ActionPlan {
  summary: string;
  observedProblem: string;
  category: string;
  riskLevel: ActionRiskLevel;
  rootCauses: string[];
  probableCause: string;
  immediateAction: string;
  correctiveAction: string;
  preventiveAction: string;
  steps: string[];
  prevention: string[];
  recommendedAssigneeRole: string;
  priority: CorrectiveAction['priority'];
  deadlineLabel: string;
  dueDate: string;
  recommendedDeadlineHours: number;
  recommendedDeadlineDays: number;
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
  category: string;
  keywords: RegExp;
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

type RuleInput = Omit<
  RuleDefinition,
  | 'photoRequired'
  | 'commentRequired'
  | 'employeeNameRequired'
  | 'employeeIdRequired'
  | 'managerValidationRequired'
  | 'escalationRequired'
  | 'escalationTargetRole'
  | 'relatedProcedure'
> &
  Partial<
    Pick<
      RuleDefinition,
      | 'photoRequired'
      | 'commentRequired'
      | 'employeeNameRequired'
      | 'employeeIdRequired'
      | 'managerValidationRequired'
      | 'escalationRequired'
      | 'escalationTargetRole'
      | 'relatedProcedure'
    >
  >;

const CRITICAL_EVIDENCE = [
  'Photo avant/après',
  "Commentaire d'exécution",
  "Nom et matricule de l'intervenant",
  'Validation manager',
];

function pattern(words: string[]): RegExp {
  return new RegExp(words.join('|'), 'i');
}

function rule(input: RuleInput): RuleDefinition {
  return {
    photoRequired: false,
    commentRequired: true,
    employeeNameRequired: false,
    employeeIdRequired: false,
    managerValidationRequired: false,
    escalationRequired: false,
    escalationTargetRole: null,
    relatedProcedure: null,
    ...input,
  };
}

const RULES: RuleDefinition[] = [
  rule({
    category: 'Chaîne du froid',
    keywords: pattern([
      'cha[iî]ne du froid',
      'temp[ée]rature',
      'chambre froide',
      'cong[ée]lateur',
      'r[ée]frig[ée]rateur',
      'froid positif',
      'froid n[ée]gatif',
      'rupture froid',
    ]),
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
  }),
  rule({
    category: 'DLC / DDM dépassée',
    keywords: pattern([
      '\\bdlc\\b',
      '\\bddm\\b',
      'p[ée]rim[ée]',
      'p[ée]remption',
      'date d[ée]pass[ée]e?',
      'produit expir[ée]',
    ]),
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
  }),
  rule({
    category: 'Hygiène critique',
    keywords: pattern([
      'hygi[èe]ne',
      'nettoyage',
      'salissure',
      'souillure',
      'surface sale',
      'd[ée]sinfection',
      'contamination',
      'propret[ée]',
    ]),
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
  }),
  rule({
    category: 'Produit impropre / abîmé',
    keywords: pattern([
      'produit ab[iî]m[ée]',
      'produit impropre',
      'moisissure',
      'emballage ouvert',
      'fuite',
      'casse',
      'alt[ée]r[ée]',
    ]),
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
  }),
  rule({
    category: 'Sécurité client / salarié',
    keywords: pattern([
      'danger',
      'accident',
      'blessure',
      'risque chute',
      'sol glissant',
      'obstacle',
      'client',
      'salari[ée]',
      'issue bloqu[ée]e?',
    ]),
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
  }),
  rule({
    category: 'Sécurité incendie',
    keywords: pattern([
      'incendie',
      'extincteur',
      'alarme',
      'signal[ée]tique',
      'issue de secours',
      '[ée]vacuation',
    ]),
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
  }),
  rule({
    category: 'Affichage prix / balisage',
    keywords: pattern([
      'prix',
      '[ée]tiquette',
      'balisage',
      'affichage',
      'promo',
    ]),
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
    evidenceRequired: [
      'Photo de l’étiquette corrigée',
      "Commentaire d'exécution",
    ],
    photoRequired: true,
    checklist: [
      'Identifier la référence.',
      'Vérifier le prix caisse/rayon.',
      'Corriger l’étiquette.',
      'Prendre une photo après correction.',
    ],
    relatedProcedure: 'Procédure affichage prix',
  }),
  rule({
    category: 'Facing / merchandising',
    keywords: pattern([
      'facing',
      'rayon d[ée]sordonn[ée]',
      'pr[ée]sentation',
      'merchandising',
      'rupture visuelle',
    ]),
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
    checklist: [
      'Identifier la zone.',
      'Reprendre la présentation.',
      'Vérifier le stock disponible.',
      'Joindre une photo après correction.',
    ],
    relatedProcedure: 'Procédure merchandising / facing',
  }),
  rule({
    category: 'Stock / rotation',
    keywords: pattern(['stock', 'rotation', 'fifo', 'fefo', 'r[ée]serve']),
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
    preventiveAction: 'Mettre en place un contrôle récurrent stock/rotation.',
    recommendedAssigneeRole: 'Responsable rayon / Gestionnaire stock',
    evidenceRequired: ["Commentaire d'exécution", 'Photo si nécessaire'],
    checklist: [
      'Contrôler les références concernées.',
      'Corriger la rotation.',
      'Mettre à jour le stock.',
      'Documenter la correction.',
    ],
    relatedProcedure: 'Procédure stock et rotation',
  }),
  rule({
    category: 'Formation manquante',
    keywords: pattern(['formation', 'habilitation', 'comp[ée]tence']),
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
    evidenceRequired: [
      'Attestation de formation terminée',
      'Score de validation',
    ],
    managerValidationRequired: true,
    checklist: [
      'Assigner la formation.',
      'Suivre la progression.',
      'Vérifier le score.',
      'Archiver l’attestation.',
    ],
    relatedProcedure: 'Parcours formation interne',
  }),
  rule({
    category: 'Management / organisation',
    keywords: pattern(['briefing', 'planning', 'recadrage', '[ée]quipe']),
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
    managerValidationRequired: true,
    checklist: [
      'Clarifier le problème.',
      'Réaliser un point manager.',
      'Formaliser les attendus.',
      'Planifier un suivi.',
    ],
    relatedProcedure: 'Rituel management opérationnel',
  }),
];

const GENERIC_RULE = rule({
  category: 'Non-conformité opérationnelle',
  keywords: /.*/,
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
  checklist: [
    'Qualifier la non-conformité.',
    'Corriger la situation.',
    'Documenter la correction.',
    'Vérifier l’efficacité.',
  ],
});

function cleanTitle(title: string): string {
  return title.replace(/^non[- ]conformit[ée]\s*:\s*/i, '').trim();
}

function addHours(date: Date, hours: number): string {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function selectRule(action: CorrectiveAction): RuleDefinition {
  const haystack = `${action.title} ${action.description ?? ''}`;
  return RULES.find((item) => item.keywords.test(haystack)) ?? GENERIC_RULE;
}

export function generateCorrectiveActionPlan(
  action: CorrectiveAction,
  now = new Date(),
): ActionPlan {
  const ruleDefinition = selectRule(action);
  const subject = cleanTitle(action.title);
  const description = action.description?.trim();
  const observedProblem = description ? description : subject;
  const priority =
    action.priority === 'critical' || ruleDefinition.priority === 'critical'
      ? 'critical'
      : ruleDefinition.priority;

  return {
    summary: `Plan correctif pour « ${subject} » — ${ruleDefinition.deadlineLabel}.`,
    observedProblem,
    category: ruleDefinition.category,
    riskLevel: ruleDefinition.riskLevel,
    rootCauses: [ruleDefinition.probableCause],
    probableCause: ruleDefinition.probableCause,
    immediateAction: ruleDefinition.immediateAction,
    correctiveAction: ruleDefinition.correctiveAction,
    preventiveAction: ruleDefinition.preventiveAction,
    steps: [ruleDefinition.immediateAction, ruleDefinition.correctiveAction],
    prevention: [ruleDefinition.preventiveAction],
    recommendedAssigneeRole: ruleDefinition.recommendedAssigneeRole,
    priority,
    deadlineLabel: ruleDefinition.deadlineLabel,
    dueDate: addHours(now, ruleDefinition.deadlineHours),
    recommendedDeadlineHours: ruleDefinition.deadlineHours,
    recommendedDeadlineDays: Math.max(
      1,
      Math.ceil(ruleDefinition.deadlineHours / 24),
    ),
    evidenceRequired: ruleDefinition.evidenceRequired,
    photoRequired: ruleDefinition.photoRequired,
    commentRequired: ruleDefinition.commentRequired,
    employeeNameRequired: ruleDefinition.employeeNameRequired,
    employeeIdRequired: ruleDefinition.employeeIdRequired,
    managerValidationRequired: ruleDefinition.managerValidationRequired,
    escalationRequired: ruleDefinition.escalationRequired,
    escalationTargetRole: ruleDefinition.escalationTargetRole,
    checklist: ruleDefinition.checklist,
    relatedProcedure: ruleDefinition.relatedProcedure,
  };
}

export function buildLocalActionPlan(action: CorrectiveAction): ActionPlan {
  return generateCorrectiveActionPlan(action);
}

export function formatActionPlanText(plan: ActionPlan): string {
  const list = (items: string[]) =>
    items.map((item, index) => `${index + 1}. ${item}`).join('\n');
  const yesNo = (value: boolean) => (value ? 'Oui' : 'Non');
  const requiredFields = [
    plan.photoRequired ? 'photo' : null,
    plan.commentRequired ? 'commentaire' : null,
    plan.employeeNameRequired ? 'nom exécutant' : null,
    plan.employeeIdRequired ? 'matricule' : null,
    plan.managerValidationRequired ? 'validation manager' : null,
  ].filter(Boolean);
  const escalationTarget = plan.escalationTargetRole
    ? [`Cible escalade : ${plan.escalationTargetRole}`]
    : [];
  const procedure = plan.relatedProcedure
    ? [`PROCÉDURE ASSOCIÉE\n${plan.relatedProcedure}`]
    : [];

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
    plan.deadlineLabel,
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
    ...escalationTarget,
    '',
    'CHECKLIST',
    list(plan.checklist),
    '',
    ...procedure,
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

export function buildActionPlanPrompt(action: CorrectiveAction): string {
  const plan = generateCorrectiveActionPlan(action);
  return [
    "En tant qu'expert qualité/conformité en grande distribution, propose un",
    'plan d’action correctif structuré et concret pour la non-conformité suivante.',
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
    .filter((line) => line.length > 0)
    .join('\n');
}
