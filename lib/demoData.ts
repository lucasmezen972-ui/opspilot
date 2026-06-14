import type {
  Audit,
  AuditResponse,
  AuditTemplate,
  AuditTemplateItem,
  Channel,
  ChannelMessage,
  CorrectiveAction,
  NotificationPreferences,
  Product,
  Profile,
  Task,
  Training,
  TrainingChapter,
  TrainingQuizQuestion,
  UserTrainingProgress,
} from './supabase';

/**
 * Données de démonstration en mémoire.
 * Utilisées quand isDemoMode && !session (Supabase injoignable) :
 * le dashboard et les listes affichent des données réalistes, jamais vides.
 * Les dates sont relatives à « maintenant » pour que les KPIs
 * (audits en retard, DLC critiques…) soient toujours non-nuls.
 */

export const DEMO_ORG_ID = 'demo-org-00000000-0000-0000-0000-000000000001';
export const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000001';

export type DemoSettings = {
  organizationName: string;
  storeName: string;
  preferences: NotificationPreferences;
};

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

const base = {
  organization_id: DEMO_ORG_ID,
  store_id: null,
};

export function getDemoSettings(): DemoSettings {
  return {
    organizationName: 'OpsPilot Démo',
    storeName: 'Magasin Démo',
    preferences: {
      audit_notifications: true,
      action_notifications: true,
      training_notifications: true,
      weekly_summary: true,
    },
  };
}

export function getDemoAudits(): Audit[] {
  return [
    {
      ...base,
      id: 'demo-audit-1',
      auditor_id: DEMO_USER_ID,
      title: 'Contrôle hygiène rayon frais',
      description: 'Audit quotidien température + propreté',
      location: 'Rayon frais',
      status: 'completed',
      score: 92,
      max_score: 100,
      issues_count: 1,
      photos: [],
      started_at: days(-1),
      completed_at: days(-1),
      due_date: days(-1),
      created_at: days(-1),
      updated_at: days(-1),
    },
    {
      ...base,
      id: 'demo-audit-2',
      auditor_id: DEMO_USER_ID,
      title: 'Vérification chambre froide',
      description: 'Relevé températures et joints de porte',
      location: 'Réserve',
      status: 'completed',
      score: 88,
      max_score: 100,
      issues_count: 2,
      photos: [],
      started_at: days(-3),
      completed_at: days(-3),
      due_date: days(-3),
      created_at: days(-3),
      updated_at: days(-3),
    },
    {
      ...base,
      id: 'demo-audit-3',
      auditor_id: DEMO_USER_ID,
      title: 'Audit DLC boulangerie',
      description: 'Contrôle des dates et rotation des stocks',
      location: 'Boulangerie',
      status: 'completed',
      score: 76,
      max_score: 100,
      issues_count: 4,
      photos: [],
      started_at: days(-6),
      completed_at: days(-6),
      due_date: days(-6),
      created_at: days(-6),
      updated_at: days(-6),
    },
    {
      ...base,
      id: 'demo-audit-4',
      auditor_id: DEMO_USER_ID,
      title: 'Contrôle affichage prix',
      description: 'Cohérence étiquettes / caisse',
      location: 'Surface de vente',
      status: 'in_progress',
      score: null,
      max_score: 100,
      issues_count: 0,
      photos: [],
      started_at: days(-1),
      completed_at: null,
      due_date: days(-1),
      created_at: days(-2),
      updated_at: days(-1),
    },
    {
      ...base,
      id: 'demo-audit-5',
      auditor_id: DEMO_USER_ID,
      title: 'Audit sécurité incendie',
      description: 'Extincteurs, issues de secours, BAES',
      location: 'Tout le magasin',
      status: 'pending',
      score: null,
      max_score: 100,
      issues_count: 0,
      photos: [],
      started_at: null,
      completed_at: null,
      due_date: days(-2),
      created_at: days(-5),
      updated_at: days(-5),
    },
    {
      ...base,
      id: 'demo-audit-6',
      auditor_id: DEMO_USER_ID,
      title: 'Tournée propreté parking',
      description: 'Chariots, poubelles, signalétique',
      location: 'Extérieur',
      status: 'pending',
      score: null,
      max_score: 100,
      issues_count: 0,
      photos: [],
      started_at: null,
      completed_at: null,
      due_date: days(2),
      created_at: days(0),
      updated_at: days(0),
    },
    {
      ...base,
      id: 'demo-audit-7',
      template_id: 'demo-template-haccp',
      auditor_id: DEMO_USER_ID,
      title: 'Audit HACCP professionnel',
      description: 'Parcours structuré par sections et critères pondérés',
      location: 'Cuisine centrale',
      status: 'in_progress',
      score: null,
      max_score: 100,
      issues_count: 0,
      photos: [],
      started_at: days(0),
      completed_at: null,
      due_date: days(1),
      created_at: days(0),
      updated_at: days(0),
    },
  ];
}

export function getDemoAuditTemplates(): AuditTemplate[] {
  const template = (
    id: string,
    name: string,
    description: string,
    category: string,
    icon: string,
    duration: number,
  ): AuditTemplate => ({
    id,
    organization_id: DEMO_ORG_ID,
    name,
    description,
    category,
    icon,
    estimated_duration: duration,
    max_score: 100,
    is_active: true,
    is_default: true,
    created_at: days(-30),
    updated_at: days(-1),
  });

  return [
    template(
      'demo-template-haccp',
      'HACCP alimentaire',
      'Contrôle des points critiques de sécurité alimentaire.',
      'HACCP',
      'shield-check',
      30,
    ),
    template(
      'demo-template-hygiene',
      'Hygiène générale',
      'Contrôle du personnel, des locaux et du nettoyage.',
      'Hygiène',
      'sparkles',
      25,
    ),
  ];
}

export function getDemoAuditTemplateItems(): AuditTemplateItem[] {
  const item = (
    id: string,
    templateId: string,
    section: string,
    question: string,
    itemType: AuditTemplateItem['item_type'],
    points: number,
    sortOrder: number,
    isRequired = true,
  ): AuditTemplateItem => ({
    id,
    template_id: templateId,
    section,
    question,
    item_type: itemType,
    is_required: isRequired,
    points,
    sort_order: sortOrder,
    created_at: days(-30),
  });

  return [
    item(
      'demo-haccp-item-1',
      'demo-template-haccp',
      'Réception',
      'La température des produits frais est-elle conforme ?',
      'yes_no',
      25,
      1,
    ),
    item(
      'demo-haccp-item-2',
      'demo-template-haccp',
      'Réception',
      'Évaluer la propreté de la zone de réception.',
      'score_1_5',
      20,
      2,
    ),
    item(
      'demo-haccp-item-3',
      'demo-template-haccp',
      'Stockage',
      'La séparation cru, cuit et allergènes est-elle respectée ?',
      'yes_no',
      25,
      3,
    ),
    item(
      'demo-haccp-item-4',
      'demo-template-haccp',
      'Stockage',
      'Photographier la zone de stockage contrôlée.',
      'photo',
      20,
      4,
      false,
    ),
    item(
      'demo-haccp-item-5',
      'demo-template-haccp',
      'Conclusion',
      'Observations complémentaires.',
      'text',
      10,
      5,
      false,
    ),
    item(
      'demo-hygiene-item-1',
      'demo-template-hygiene',
      'Personnel',
      'Les tenues de travail sont-elles propres et adaptées ?',
      'yes_no',
      25,
      1,
    ),
    item(
      'demo-hygiene-item-2',
      'demo-template-hygiene',
      'Personnel',
      'Évaluer les pratiques de lavage des mains.',
      'score_1_5',
      20,
      2,
    ),
    item(
      'demo-hygiene-item-3',
      'demo-template-hygiene',
      'Locaux',
      'Les sols et surfaces sont-ils propres ?',
      'yes_no',
      25,
      3,
    ),
    item(
      'demo-hygiene-item-4',
      'demo-template-hygiene',
      'Locaux',
      'Photographier la zone contrôlée.',
      'photo',
      20,
      4,
      false,
    ),
    item(
      'demo-hygiene-item-5',
      'demo-template-hygiene',
      'Conclusion',
      'Préciser les améliorations recommandées.',
      'text',
      10,
      5,
      false,
    ),
  ];
}

export function getDemoAuditResponses(): AuditResponse[] {
  return [];
}

export function getDemoProducts(): Product[] {
  const p = (
    id: string,
    name: string,
    category: string,
    dlc: string | null,
    stock: number,
    price: number,
    barcode: string,
  ): Product => ({
    ...base,
    id,
    name,
    barcode,
    category,
    price,
    stock_quantity: stock,
    min_stock: 5,
    dlc,
    image_url: null,
    added_by: DEMO_USER_ID,
    created_at: days(-30),
    updated_at: days(-1),
  });

  return [
    p(
      'demo-prod-1',
      'Yaourt nature x8',
      'Crèmerie',
      days(1),
      24,
      2.49,
      '3000000000001',
    ),
    p(
      'demo-prod-2',
      'Jambon blanc 4 tranches',
      'Charcuterie',
      days(-1),
      8,
      3.2,
      '3000000000002',
    ),
    p(
      'demo-prod-3',
      'Saumon fumé 120g',
      'Marée',
      days(2),
      6,
      6.9,
      '3000000000003',
    ),
    p(
      'demo-prod-4',
      'Salade composée poulet',
      'Snacking',
      days(0),
      12,
      4.5,
      '3000000000004',
    ),
    p(
      'demo-prod-5',
      'Lait demi-écrémé 1L',
      'Crèmerie',
      days(12),
      60,
      1.15,
      '3000000000005',
    ),
    p(
      'demo-prod-6',
      'Beurre doux 250g',
      'Crèmerie',
      days(20),
      30,
      2.8,
      '3000000000006',
    ),
    p(
      'demo-prod-7',
      'Steak haché 2x125g',
      'Boucherie',
      days(3),
      14,
      4.9,
      '3000000000007',
    ),
    p(
      'demo-prod-8',
      'Pain de mie complet',
      'Boulangerie',
      days(6),
      18,
      1.9,
      '3000000000008',
    ),
    p(
      'demo-prod-9',
      'Jus d’orange frais 1L',
      'Frais',
      days(5),
      10,
      2.95,
      '3000000000009',
    ),
    p(
      'demo-prod-10',
      'Crème fraîche 30cl',
      'Crèmerie',
      days(9),
      22,
      1.75,
      '3000000000010',
    ),
    p(
      'demo-prod-11',
      'Pizza margherita',
      'Surgelés',
      days(120),
      16,
      3.5,
      '3000000000011',
    ),
    p(
      'demo-prod-12',
      'Eau minérale 6x1,5L',
      'Boissons',
      null,
      45,
      3.1,
      '3000000000012',
    ),
  ];
}

export function getDemoActions(): CorrectiveAction[] {
  return [
    {
      ...base,
      id: 'demo-action-1',
      audit_id: 'demo-audit-3',
      audit_response_id: null,
      title: 'Retirer les produits DLC dépassée (boulangerie)',
      description: 'Retrait immédiat + traçabilité dans le registre',
      assignee_id: DEMO_USER_ID,
      priority: 'critical',
      status: 'open',
      due_date: days(0),
      resolved_at: null,
      created_by: DEMO_USER_ID,
      created_at: days(-6),
      updated_at: days(-6),
    },
    {
      ...base,
      id: 'demo-action-2',
      audit_id: 'demo-audit-2',
      audit_response_id: null,
      title: 'Remplacer le joint de la chambre froide n°2',
      description: 'Joint usé constaté lors de l’audit',
      assignee_id: DEMO_USER_ID,
      priority: 'high',
      status: 'in_progress',
      due_date: days(3),
      resolved_at: null,
      created_by: DEMO_USER_ID,
      created_at: days(-3),
      updated_at: days(-1),
    },
    {
      ...base,
      id: 'demo-action-3',
      audit_id: 'demo-audit-1',
      audit_response_id: null,
      title: 'Nettoyer la vitrine du rayon frais',
      description: 'Traces constatées côté client',
      assignee_id: DEMO_USER_ID,
      priority: 'medium',
      status: 'open',
      due_date: days(2),
      resolved_at: null,
      created_by: DEMO_USER_ID,
      created_at: days(-1),
      updated_at: days(-1),
    },
    {
      ...base,
      id: 'demo-action-4',
      audit_id: null,
      audit_response_id: null,
      title: 'Mettre à jour l’affichage allergènes',
      description: 'Nouvelle recette snacking',
      assignee_id: DEMO_USER_ID,
      priority: 'low',
      status: 'done',
      due_date: days(-2),
      resolved_at: days(-2),
      created_by: DEMO_USER_ID,
      created_at: days(-8),
      updated_at: days(-2),
    },
    {
      ...base,
      id: 'demo-action-5',
      audit_id: null,
      audit_response_id: null,
      title: 'Former l’équipe au nouveau plan de nettoyage',
      description: 'Session 30 min, support fourni',
      assignee_id: DEMO_USER_ID,
      priority: 'medium',
      status: 'done',
      due_date: days(-5),
      resolved_at: days(-5),
      created_by: DEMO_USER_ID,
      created_at: days(-10),
      updated_at: days(-5),
    },
  ];
}

export function getDemoTasks(): Task[] {
  return [
    {
      ...base,
      id: 'demo-task-1',
      assigned_to: DEMO_USER_ID,
      created_by: DEMO_USER_ID,
      title: 'Réassort rayon crèmerie',
      description: 'Compléter les yaourts et le lait',
      location: 'Crèmerie',
      priority: 'high',
      status: 'pending',
      estimated_time_minutes: 30,
      due_date: days(0),
      created_at: days(-1),
      updated_at: days(-1),
      completed_at: null,
    },
    {
      ...base,
      id: 'demo-task-2',
      assigned_to: DEMO_USER_ID,
      created_by: DEMO_USER_ID,
      title: 'Relevé des températures matin',
      description: 'Chambres froides + vitrines',
      location: 'Réserve',
      priority: 'urgent',
      status: 'in_progress',
      estimated_time_minutes: 15,
      due_date: days(0),
      created_at: days(0),
      updated_at: days(0),
      completed_at: null,
    },
    {
      ...base,
      id: 'demo-task-3',
      assigned_to: DEMO_USER_ID,
      created_by: DEMO_USER_ID,
      title: 'Préparer la commande fournisseur',
      description: 'Volumes semaine prochaine',
      location: 'Bureau',
      priority: 'medium',
      status: 'pending',
      estimated_time_minutes: 45,
      due_date: days(1),
      created_at: days(-1),
      updated_at: days(-1),
      completed_at: null,
    },
    {
      ...base,
      id: 'demo-task-4',
      assigned_to: DEMO_USER_ID,
      created_by: DEMO_USER_ID,
      title: 'Vérifier la propreté de l’accueil',
      description: 'Tournée de contrôle',
      location: 'Accueil',
      priority: 'low',
      status: 'completed',
      estimated_time_minutes: 10,
      due_date: days(-1),
      created_at: days(-2),
      updated_at: days(-1),
      completed_at: days(-1),
    },
  ];
}

export function getDemoTrainings(): Training[] {
  const t = (
    id: string,
    title: string,
    category: string,
    difficulty: Training['difficulty'],
    duration: number,
    xp: number,
    minScore = 70,
  ): Training => ({
    id,
    organization_id: DEMO_ORG_ID,
    title,
    content:
      'Module de formation interactif avec chapitres, cas pratiques et quiz certifiant.',
    category,
    difficulty,
    duration_minutes: duration,
    xp_reward: xp,
    is_active: true,
    min_score: minScore,
    created_at: days(-30),
    updated_at: days(-7),
    is_default: true,
  });

  return [
    t(
      'demo-training-1',
      'Hygiène et sécurité alimentaire (HACCP)',
      'Hygiène',
      'beginner',
      25,
      50,
    ),
    t(
      'demo-training-2',
      'Gestion des DLC et rotation des stocks',
      'Qualité',
      'beginner',
      15,
      30,
    ),
    t(
      'demo-training-3',
      'Chaîne du froid : bonnes pratiques',
      'Qualité',
      'intermediate',
      20,
      40,
    ),
    t(
      'demo-training-4',
      'Accueil client et gestion des réclamations',
      'Relation client',
      'intermediate',
      30,
      60,
    ),
    t(
      'demo-training-5',
      'Procédures de caisse et sécurité des encaissements',
      'Caisse',
      'beginner',
      20,
      40,
    ),
    t(
      'demo-training-6',
      "Management de proximité et animation d'équipe",
      'Management',
      'advanced',
      45,
      80,
      75,
    ),
  ];
}

export function getDemoTrainingChapters(): TrainingChapter[] {
  const chapters: Record<string, [string, string][]> = {
    'demo-training-1': [
      [
        'Comprendre la méthode HACCP',
        '# Objectif\n\nIdentifier et maîtriser les dangers biologiques, chimiques et physiques.',
      ],
      [
        'Hygiène personnelle',
        '# Gestes essentiels\n\n- Mains propres\n- Tenue dédiée\n- Plaies protégées\n- Aucun bijou',
      ],
      [
        'Contaminations croisées',
        '# Séparer les flux\n\nUtilisez du matériel distinct pour les produits crus et prêts à consommer.',
      ],
      [
        'Tracer et réagir',
        '# Traçabilité\n\nIsolez tout produit douteux et consignez immédiatement l’action corrective.',
      ],
    ],
    'demo-training-2': [
      [
        'DLC, DDM et ouverture',
        '# Distinguer les dates\n\nLa DLC concerne la sécurité. La DDM concerne principalement la qualité.',
      ],
      [
        'FIFO et FEFO',
        '# Organiser le stock\n\nPlacez les dates les plus courtes devant et contrôlez chaque référence.',
      ],
      [
        'Contrôle quotidien',
        '# Routine\n\nVérifiez les produits expirés, à J0, J+1 et J+3 selon le rayon.',
      ],
      [
        'Traiter une anomalie',
        '# Retrait\n\nRetirez, isolez et signalez immédiatement tout produit non conforme.',
      ],
    ],
    'demo-training-3': [
      [
        'Pourquoi le froid est critique',
        '# Risque sanitaire\n\nLe froid ralentit les microbes sans les détruire.',
      ],
      [
        'Réception',
        '# Contrôle\n\nMesurez la température et vérifiez les emballages avant acceptation.',
      ],
      [
        'Stockage',
        '# Circulation de l’air\n\nNe surchargez pas les meubles et gardez les portes fermées.',
      ],
      [
        'Rupture de froid',
        '# Réaction\n\nNotez la durée, isolez les lots et demandez une décision au responsable.',
      ],
    ],
    'demo-training-4': [
      [
        'Les premières secondes',
        '# Accueil\n\nRegardez le client, saluez-le et rendez-vous disponible.',
      ],
      [
        'Écoute active',
        '# Comprendre\n\nLaissez parler, reformulez les faits et vérifiez l’attente.',
      ],
      [
        'Proposer une solution',
        '# Agir\n\nPrécisez l’action, le délai et la prochaine étape.',
      ],
      [
        'Clore et capitaliser',
        '# Suivi\n\nValidez la satisfaction puis tracez les problèmes récurrents.',
      ],
    ],
    'demo-training-5': [
      [
        'Ouverture de caisse et fonds de départ',
        "# Objectif\n\nSécuriser chaque ouverture et garantir l'exactitude du fond de départ.\n\n# Procédure\n\n1. Récupérer l'enveloppe scellée auprès du responsable\n2. Compter devant témoin et signer le registre\n3. Vérifier le bon état des équipements (scanner, TPE, imprimante)\n4. Lancer le logiciel et s'authentifier avec ses propres identifiants\n\n# Règle d'or\n\nNe jamais utiliser le code d'un collègue. Fond de départ standard : 150 €.",
      ],
      [
        "Procédures d'encaissement",
        "# Types de paiement\n\n- Espèces : rendre la monnaie en comptant à voix haute\n- CB/NFC : vérifier l'approbation avant de rendre la marchandise\n- Chèques : vérifier date, montant en lettres et pièce d'identité\n\n# Annulation et remboursement\n\nToute annulation > 50 € doit être validée par un responsable.\n\n# Litiges\n\nSi un client conteste : ne jamais ouvrir le tiroir sans vérification. Appeler le responsable si le désaccord persiste.",
      ],
      [
        'Clôture de caisse et remise en coffre',
        '# Procédure de clôture\n\n1. Éditer le ticket de clôture depuis le logiciel\n2. Compter physiquement toutes les coupures et pièces\n3. Comparer au montant théorique\n4. Remplir la fiche de clôture\n5. Isoler la remise du fond suivant\n6. Déposer en enveloppe scellée en coffre devant témoin\n\n# Écarts de caisse\n\n- < 5 € : note dans le registre\n- 5 à 50 € : responsable + investigation\n- > 50 € : direction + possible déclaration',
      ],
      [
        'Sécurité et vigilance anti-fraude',
        "# Faux billets\n\nUtilisez le stylo détecteur ou UV pour tout billet de 50 € et plus.\n\n# Techniques de fraude courantes\n\n- Confusion sur le rendu de monnaie\n- Retrait rapide après paiement CB\n- Faux avoirs ou bons périmés\n\n# Conduite à tenir\n\nNe jamais céder à la pression. Appeler le responsable pour toute situation anormale. En cas d'agression : activez l'alarme discrète, mémorisez les traits, ne résistez pas.",
      ],
    ],
    'demo-training-6': [
      [
        'Rôle et styles de management',
        "# Objectif\n\nComprendre le rôle de manager de première ligne en grande distribution.\n\n# Missions fondamentales\n\n- Animer et motiver l'équipe au quotidien\n- Garantir la qualité d'exécution des procédures\n- Gérer les plannings et les aléas RH\n\n# Les 4 styles de management\n\n- Directif : donne des instructions claires (nouveau collaborateur)\n- Persuasif : explique le sens et obtient l'adhésion\n- Participatif : implique l'équipe dans les décisions\n- Délégatif : donne autonomie aux collaborateurs expérimentés",
      ],
      [
        "Animation et motivation de l'équipe",
        '# Leviers de motivation\n\n- Reconnaissance : valoriser les réussites en public\n- Responsabilisation : confier des missions avec autonomie\n- Développement : proposer des formations et des évolutions\n\n# Réunion de rayon hebdomadaire (15 min)\n\n1. Résultats de la semaine\n2. Objectifs à venir\n3. Points opérationnels urgents\n4. Temps de parole équipe\n\n# Gestion des conflits\n\nEntretien individuel séparé, puis réunion commune, puis solution formalisée.',
      ],
      [
        'Entretiens individuels et évaluation',
        "# Types d'entretiens\n\n- Suivi mensuel (15-30 min) : progression, difficultés, objectifs\n- Évaluation annuelle : bilan, objectifs N+1, formation\n- Recadrage : écart constaté, plan de progrès formalisé\n\n# Structure d'un entretien efficace\n\n1. Cadrer (durée, objectif, confidentialité)\n2. Écouter (70 % du temps de parole au collaborateur)\n3. Reformuler et co-construire les actions\n4. Formaliser par compte-rendu signé",
      ],
      [
        'Planification et gestion des aléas',
        "# Planification du planning\n\n- Anticiper les pics d'activité (promotions, fêtes, livraisons)\n- Respecter les 11h de repos entre deux services\n- Afficher le planning 2 semaines à l'avance minimum\n\n# Délégation efficace\n\nDéléguer = confier une mission avec les moyens et l'autorité. Faire reformuler la mission par le collaborateur.\n\n# Gestion des aléas\n\n- Absence imprévue : liste remplaçants + réorganisation immédiate\n- Rupture de stock : alerte responsable + affichage rayon\n- Incident client : prise en charge + rapport sous 24h",
      ],
    ],
  };

  return Object.entries(chapters).flatMap(([trainingId, entries]) =>
    entries.map(([title, body], index) => ({
      id: `${trainingId}-chapter-${index + 1}`,
      training_id: trainingId,
      title,
      body,
      sort_order: index + 1,
      created_at: days(-30),
      updated_at: days(-7),
    })),
  );
}

export function getDemoTrainingQuizQuestions(): TrainingQuizQuestion[] {
  const questions: Record<string, [string, string[], number][]> = {
    'demo-training-1': [
      [
        'Quel est le rôle principal de HACCP ?',
        ['Décorer les locaux', 'Maîtriser les dangers', 'Fixer les prix'],
        1,
      ],
      [
        'Quand faut-il se laver les mains ?',
        ['Après une manipulation contaminante', 'Une fois par jour', 'Jamais'],
        0,
      ],
      [
        'Comment éviter une contamination croisée ?',
        [
          'Mélanger les outils',
          'Séparer le matériel',
          'Ignorer les allergènes',
        ],
        1,
      ],
      [
        'Que faire d’un produit douteux ?',
        ['Le vendre', 'L’isoler', 'Changer son étiquette'],
        1,
      ],
      [
        'Quel élément assure la traçabilité ?',
        ['Le numéro de lot', 'La météo', 'Le planning'],
        0,
      ],
    ],
    'demo-training-2': [
      [
        'Une DLC dépassée impose de…',
        ['Retirer le produit', 'Le promouvoir', 'Le réétiqueter'],
        0,
      ],
      [
        'FEFO signifie…',
        [
          'Premier expiré, premier sorti',
          'Dernier entré, premier sorti',
          'Aucun contrôle',
        ],
        0,
      ],
      [
        'Où placer les dates courtes ?',
        ['Devant', 'Derrière', 'Sans règle'],
        0,
      ],
      [
        'Que faut-il enregistrer ?',
        ['Les anomalies', 'La météo', 'La musique'],
        0,
      ],
      [
        'Un produit expiré en rayon doit être…',
        ['Isolé immédiatement', 'Vendu rapidement', 'Caché'],
        0,
      ],
    ],
    'demo-training-3': [
      [
        'Le froid détruit-il tous les microbes ?',
        ['Oui', 'Non', 'Uniquement la nuit'],
        1,
      ],
      [
        'Que contrôler à la réception ?',
        ['La température', 'La couleur du camion', 'Le prix'],
        0,
      ],
      [
        'Pourquoi ne pas surcharger un meuble ?',
        [
          'Pour laisser circuler l’air',
          'Pour réduire la lumière',
          'Pour gagner du temps',
        ],
        0,
      ],
      [
        'Que noter lors d’une rupture ?',
        ['Température et durée', 'Couleur du produit', 'Nom des clients'],
        0,
      ],
      [
        'Qui décide du sort du lot ?',
        ['Le responsable', 'Un client', 'Personne'],
        0,
      ],
    ],
    'demo-training-4': [
      [
        'Quel geste crée un bon contact ?',
        ['Saluer le client', 'Éviter le regard', 'Continuer sa discussion'],
        0,
      ],
      [
        'Pourquoi reformuler ?',
        ['Vérifier la compréhension', 'Interrompre', 'Contester'],
        0,
      ],
      [
        'Une solution claire précise…',
        ['Action et délai', 'Uniquement les limites', 'Rien'],
        0,
      ],
      [
        'Comment clore une réclamation ?',
        ['Vérifier la satisfaction', 'Partir', 'Supprimer la trace'],
        0,
      ],
      [
        'Pourquoi tracer les problèmes récurrents ?',
        [
          'Pour améliorer les opérations',
          'Pour ralentir',
          'Pour éviter de répondre',
        ],
        0,
      ],
    ],
  };

  const base = Object.entries(questions).flatMap(([trainingId, entries]) =>
    entries.map(([question, options, correctIndex], index) => ({
      id: `${trainingId}-quiz-${index + 1}`,
      training_id: trainingId,
      question,
      options,
      correct_index: correctIndex,
      sort_order: index + 1,
      difficulty: 'easy' as TrainingQuizQuestion['difficulty'],
      question_type: 'qcm_single' as TrainingQuizQuestion['question_type'],
      is_critical: false,
      created_at: days(-30),
      updated_at: days(-7),
    })),
  );

  // Modules 5 et 6 avec niveaux de difficulté et questions critiques
  type RichQ = {
    q: string;
    opts: string[];
    c: number;
    d: TrainingQuizQuestion['difficulty'];
    crit?: boolean;
  };
  const richModules: Record<string, RichQ[]> = {
    'demo-training-5': [
      {
        q: "Que faire avant d'ouvrir la caisse ?",
        opts: [
          'Compter le fond devant un témoin et signer',
          'Ouvrir directement',
          'Utiliser le code du collègue',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Pour un billet de 50 € ou plus, que faire ?',
        opts: [
          'Vérifier avec le stylo ou UV',
          'Accepter sans vérification',
          'Refuser systématiquement',
        ],
        c: 0,
        d: 'medium',
        crit: true,
      },
      {
        q: 'Que faire si un écart de caisse dépasse 50 € ?',
        opts: [
          'Alerter la direction + déclaration possible',
          'Compenser de sa poche',
          'Ne rien faire',
        ],
        c: 0,
        d: 'hard',
        crit: true,
      },
      {
        q: 'Quelle procédure pour une annulation supérieure à 50 € ?',
        opts: [
          'Validation obligatoire du responsable',
          'Annuler seul discrètement',
          'Rembourser en espèces sans trace',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: "En cas d'agression, quelle est la priorité ?",
        opts: [
          'Votre sécurité — ne résistez pas',
          'Protéger la caisse',
          'Appeler la police seul',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Le fond de départ standard est de…',
        opts: ['150 €', '50 €', '500 €', '1 000 €'],
        c: 0,
        d: 'easy',
      },
    ],
    'demo-training-6': [
      {
        q: 'Le manager de proximité est avant tout…',
        opts: [
          "Un facilitateur pour l'équipe",
          'Un contrôleur strict',
          'Un exécutant de la direction',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Quel style de management convient à un nouveau collaborateur ?',
        opts: ['Directif', 'Délégatif', 'Participatif'],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Quelle proportion de temps de parole pour le collaborateur en entretien ?',
        opts: ['70 % du temps', '10 % du temps', '50 % du temps'],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Quel est le repos minimum entre deux services consécutifs ?',
        opts: ['11 heures', '8 heures', '6 heures'],
        c: 0,
        d: 'hard',
        crit: true,
      },
      {
        q: 'Comment déléguer efficacement ?',
        opts: [
          'Confier mission + moyens + faire reformuler',
          "Donner l'ordre et partir",
          'Faire soi-même pour être sûr',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: "Pourquoi formaliser les engagements d'entretien par écrit ?",
        opts: [
          'Pour tracer et éviter les malentendus',
          'Pour faire peur au collaborateur',
          'Pour la DRH uniquement',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: "Lors d'un conflit entre collègues, quelle est la première étape ?",
        opts: [
          'Entretien individuel séparé de chaque partie',
          'Réunion commune immédiate',
          'Ignorer le conflit',
        ],
        c: 0,
        d: 'hard',
      },
    ],
  };

  const richEntries = Object.entries(richModules).flatMap(
    ([trainingId, entries]) =>
      entries.map((e, index) => ({
        id: `${trainingId}-quiz-${index + 1}`,
        training_id: trainingId,
        question: e.q,
        options: e.opts,
        correct_index: e.c,
        sort_order: index + 1,
        difficulty: e.d,
        question_type: 'qcm_single' as TrainingQuizQuestion['question_type'],
        is_critical: e.crit ?? false,
        created_at: days(-30),
        updated_at: days(-7),
      })),
  );

  return [...base, ...richEntries];
}

export function getDemoTrainingProgress(): UserTrainingProgress[] {
  return [
    {
      id: 'demo-progress-1',
      user_id: DEMO_USER_ID,
      training_id: 'demo-training-1',
      status: 'completed',
      progress_percentage: 100,
      completed_chapter_ids: [
        'demo-training-1-chapter-1',
        'demo-training-1-chapter-2',
        'demo-training-1-chapter-3',
        'demo-training-1-chapter-4',
      ],
      score: 90,
      started_at: days(-10),
      completed_at: days(-9),
      created_at: days(-10),
      updated_at: days(-9),
    },
    {
      id: 'demo-progress-2',
      user_id: DEMO_USER_ID,
      training_id: 'demo-training-2',
      status: 'in_progress',
      progress_percentage: 50,
      completed_chapter_ids: [
        'demo-training-2-chapter-1',
        'demo-training-2-chapter-2',
      ],
      score: null,
      started_at: days(-2),
      completed_at: null,
      created_at: days(-2),
      updated_at: days(-1),
    },
  ];
}

export interface DemoTeamMember {
  id: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employé' | 'stagiaire';
  email: string;
}

/**
 * Profils complets de l'équipe démo (source de vérité unique).
 * Sert à l'écran Équipe (useTeam) et, dérivé, à la supervision formation.
 */
export function getDemoTeamProfiles(): Profile[] {
  const member = (
    id: string,
    fullName: string,
    role: Profile['role'],
    email: string,
    level: number,
    xp: number,
    totalAudits: number,
    avgScore: number,
    completedTrainings: number,
    activeHours: number,
    lastActiveDays: number,
  ): Profile => ({
    id,
    organization_id: DEMO_ORG_ID,
    store_id: null,
    email,
    full_name: fullName,
    phone: null,
    avatar_url: null,
    role,
    department_id: null,
    level,
    xp,
    total_audits: totalAudits,
    avg_score: avgScore,
    completed_trainings: completedTrainings,
    active_time_hours: activeHours,
    last_active: days(-lastActiveDays),
    is_active: true,
    created_at: days(-180),
    updated_at: days(-lastActiveDays),
  });

  return [
    member(
      DEMO_USER_ID,
      'Marie Dupont',
      'manager',
      'marie.dupont@demo.fr',
      5,
      420,
      12,
      87,
      8,
      156,
      0,
    ),
    member(
      'demo-member-2',
      'Jean Martin',
      'employé',
      'jean.martin@demo.fr',
      4,
      310,
      9,
      82,
      5,
      120,
      0,
    ),
    member(
      'demo-member-3',
      'Sophie Bernard',
      'employé',
      'sophie.bernard@demo.fr',
      3,
      240,
      7,
      90,
      4,
      98,
      1,
    ),
    member(
      'demo-member-4',
      'Thomas Lefèvre',
      'stagiaire',
      'thomas.lefevre@demo.fr',
      1,
      60,
      2,
      74,
      1,
      32,
      2,
    ),
    member(
      'demo-member-5',
      'Emma Rousseau',
      'employé',
      'emma.rousseau@demo.fr',
      5,
      460,
      14,
      85,
      7,
      168,
      0,
    ),
    member(
      'demo-member-6',
      'Lucas Moreau',
      'employé',
      'lucas.moreau@demo.fr',
      2,
      130,
      4,
      0,
      0,
      54,
      6,
    ),
  ];
}

export function getDemoTeamMembers(): DemoTeamMember[] {
  return getDemoTeamProfiles().map((p) => ({
    id: p.id,
    full_name: p.full_name ?? '',
    role: p.role as DemoTeamMember['role'],
    email: p.email,
  }));
}

export function getDemoOrgTrainingProgress(): UserTrainingProgress[] {
  type Scenario = {
    tid: string;
    status: UserTrainingProgress['status'];
    score: number | null;
    pct: number;
  };
  const scenarios: Record<string, Scenario[]> = {
    [DEMO_USER_ID]: [
      { tid: 'demo-training-1', status: 'completed', score: 90, pct: 100 },
      { tid: 'demo-training-2', status: 'completed', score: 95, pct: 100 },
      { tid: 'demo-training-3', status: 'completed', score: 88, pct: 100 },
      { tid: 'demo-training-4', status: 'completed', score: 84, pct: 100 },
    ],
    'demo-member-2': [
      { tid: 'demo-training-1', status: 'completed', score: 85, pct: 100 },
      { tid: 'demo-training-2', status: 'completed', score: 92, pct: 100 },
      { tid: 'demo-training-3', status: 'in_progress', score: null, pct: 50 },
    ],
    'demo-member-3': [
      { tid: 'demo-training-1', status: 'completed', score: 78, pct: 100 },
      { tid: 'demo-training-3', status: 'completed', score: 95, pct: 100 },
      { tid: 'demo-training-5', status: 'in_progress', score: null, pct: 25 },
    ],
    'demo-member-4': [
      { tid: 'demo-training-1', status: 'in_progress', score: null, pct: 33 },
    ],
    'demo-member-5': [
      { tid: 'demo-training-1', status: 'completed', score: 90, pct: 100 },
      { tid: 'demo-training-2', status: 'completed', score: 88, pct: 100 },
      { tid: 'demo-training-3', status: 'completed', score: 75, pct: 100 },
      { tid: 'demo-training-4', status: 'completed', score: 82, pct: 100 },
      { tid: 'demo-training-5', status: 'in_progress', score: null, pct: 60 },
    ],
    'demo-member-6': [],
  };

  return Object.entries(scenarios).flatMap(([userId, entries]) =>
    entries.map(({ tid, status, score, pct }, i) => ({
      id: `demo-org-progress-${userId}-${tid}`,
      user_id: userId,
      training_id: tid,
      status,
      progress_percentage: pct,
      completed_chapter_ids: status === 'completed' ? ['all'] : [],
      score,
      started_at: days(-20 - i),
      completed_at: status === 'completed' ? days(-5 - i) : null,
      created_at: days(-25),
      updated_at: days(-1),
    })),
  );
}

export function getDemoChannels(): Channel[] {
  return [
    {
      id: 'demo-channel-1',
      organization_id: DEMO_ORG_ID,
      name: 'Général',
      description: "Canal ouvert à toute l'équipe",
      type: 'general',
      is_archived: false,
      created_by: DEMO_USER_ID,
      created_at: days(-60),
      updated_at: days(-1),
    },
    {
      id: 'demo-channel-2',
      organization_id: DEMO_ORG_ID,
      name: 'Annonces direction',
      description: 'Annonces officielles — lecture seule pour les employés',
      type: 'announcement',
      is_archived: false,
      created_by: DEMO_USER_ID,
      created_at: days(-60),
      updated_at: days(-2),
    },
    {
      id: 'demo-channel-3',
      organization_id: DEMO_ORG_ID,
      name: 'Rayon frais',
      description: 'Équipe rayon frais et produits laitiers',
      type: 'department',
      is_archived: false,
      created_by: 'demo-member-2',
      created_at: days(-45),
      updated_at: days(-1),
    },
    {
      id: 'demo-channel-4',
      organization_id: DEMO_ORG_ID,
      name: 'Hygiène & Qualité',
      description: 'Suivi HACCP, non-conformités et bonnes pratiques',
      type: 'department',
      is_archived: false,
      created_by: DEMO_USER_ID,
      created_at: days(-30),
      updated_at: days(0),
    },
  ];
}

export function getDemoChannelMessages(): ChannelMessage[] {
  return [
    {
      id: 'demo-cmsg-1',
      channel_id: 'demo-channel-1',
      user_id: DEMO_USER_ID,
      sender_name: 'Marie Dupont',
      sender_role: 'manager',
      content:
        'Bonjour à tous ! Réunion du personnel vendredi à 9h en salle de pause. Présence obligatoire.',
      message_type: 'announcement',
      is_pinned: true,
      read_by: [DEMO_USER_ID, 'demo-member-2', 'demo-member-5'],
      created_at: days(-3),
    },
    {
      id: 'demo-cmsg-2',
      channel_id: 'demo-channel-1',
      user_id: 'demo-member-2',
      sender_name: 'Jean Martin',
      sender_role: 'employé',
      content:
        "Noté, merci ! Est-ce qu'on doit apporter nos plannings de la semaine ?",
      message_type: 'text',
      is_pinned: false,
      read_by: [DEMO_USER_ID, 'demo-member-2'],
      created_at: days(-3),
    },
    {
      id: 'demo-cmsg-3',
      channel_id: 'demo-channel-1',
      user_id: DEMO_USER_ID,
      sender_name: 'Marie Dupont',
      sender_role: 'manager',
      content: 'Oui, merci de les avoir avec vous.',
      message_type: 'text',
      is_pinned: false,
      read_by: [DEMO_USER_ID, 'demo-member-2'],
      created_at: days(-3),
    },
    {
      id: 'demo-cmsg-4',
      channel_id: 'demo-channel-1',
      user_id: 'demo-member-5',
      sender_name: 'Emma Rousseau',
      sender_role: 'employé',
      content:
        "Rappel : le nettoyage des chariots est prévu ce soir à 20h, besoin d'un volontaire supplémentaire.",
      message_type: 'text',
      is_pinned: false,
      read_by: [DEMO_USER_ID],
      created_at: days(-1),
    },
    {
      id: 'demo-cmsg-5',
      channel_id: 'demo-channel-2',
      user_id: DEMO_USER_ID,
      sender_name: 'Marie Dupont',
      sender_role: 'manager',
      content:
        'Fermeture exceptionnelle le lundi 23 décembre — le magasin sera fermé toute la journée pour travaux.',
      message_type: 'announcement',
      is_pinned: true,
      read_by: [
        DEMO_USER_ID,
        'demo-member-2',
        'demo-member-3',
        'demo-member-5',
      ],
      created_at: days(-7),
    },
    {
      id: 'demo-cmsg-6',
      channel_id: 'demo-channel-2',
      user_id: DEMO_USER_ID,
      sender_name: 'Marie Dupont',
      sender_role: 'manager',
      content:
        'Nouvelle procédure HACCP applicable dès le 1er janvier. Document disponible en salle du personnel.',
      message_type: 'announcement',
      is_pinned: false,
      read_by: [DEMO_USER_ID, 'demo-member-5'],
      created_at: days(-2),
    },
    {
      id: 'demo-cmsg-7',
      channel_id: 'demo-channel-3',
      user_id: 'demo-member-3',
      sender_name: 'Sophie Bernard',
      sender_role: 'employé',
      content:
        'Contrôle température ce matin : chambre négative à -18°C, positif à +4°C. Tout est OK.',
      message_type: 'text',
      is_pinned: false,
      read_by: [DEMO_USER_ID, 'demo-member-2', 'demo-member-3'],
      created_at: days(-1),
    },
    {
      id: 'demo-cmsg-8',
      channel_id: 'demo-channel-3',
      user_id: 'demo-member-2',
      sender_name: 'Jean Martin',
      sender_role: 'employé',
      content:
        "Besoin d'un renfort cet après-midi pour le réassort yaourts — quelqu'un de dispo ?",
      message_type: 'text',
      is_pinned: false,
      read_by: ['demo-member-2'],
      created_at: days(0),
    },
    {
      id: 'demo-cmsg-9',
      channel_id: 'demo-channel-4',
      user_id: DEMO_USER_ID,
      sender_name: 'Marie Dupont',
      sender_role: 'manager',
      content:
        "Non-conformité détectée lors de l'audit de ce matin : étiquettes DLC manquantes sur 3 produits rayon crémerie. Action corrective lancée.",
      message_type: 'announcement',
      is_pinned: true,
      read_by: [DEMO_USER_ID, 'demo-member-3'],
      created_at: days(-1),
    },
    {
      id: 'demo-cmsg-10',
      channel_id: 'demo-channel-4',
      user_id: 'demo-member-5',
      sender_name: 'Emma Rousseau',
      sender_role: 'employé',
      content:
        "J'ai corrigé les étiquettes à 14h30. À revérifier demain matin.",
      message_type: 'text',
      is_pinned: false,
      read_by: [DEMO_USER_ID, 'demo-member-5'],
      created_at: days(-1),
    },
    {
      id: 'demo-cmsg-11',
      channel_id: 'demo-channel-4',
      user_id: DEMO_USER_ID,
      sender_name: 'Marie Dupont',
      sender_role: 'manager',
      content:
        "Merci Emma. Procédure de vérification quotidienne rappelée à toute l'équipe.",
      message_type: 'text',
      is_pinned: false,
      read_by: [DEMO_USER_ID],
      created_at: days(0),
    },
  ];
}

/** Génère un identifiant local unique pour les créations en mode démo. */
export function demoId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}
