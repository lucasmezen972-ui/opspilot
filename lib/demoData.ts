import type {
  Audit,
  AuditResponse,
  AuditTemplate,
  AuditTemplateItem,
  CorrectiveAction,
  Product,
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

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

const base = {
  organization_id: DEMO_ORG_ID,
  store_id: null,
};

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
  ): Training => ({
    id,
    organization_id: DEMO_ORG_ID,
    title,
    content:
      'Module de formation interactif : bonnes pratiques, points de contrôle et quiz de validation.',
    category,
    difficulty,
    duration_minutes: duration,
    xp_reward: xp,
    is_active: true,
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

  return Object.entries(questions).flatMap(([trainingId, entries]) =>
    entries.map(([question, options, correctIndex], index) => ({
      id: `${trainingId}-quiz-${index + 1}`,
      training_id: trainingId,
      question,
      options,
      correct_index: correctIndex,
      sort_order: index + 1,
      created_at: days(-30),
      updated_at: days(-7),
    })),
  );
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

/** Génère un identifiant local unique pour les créations en mode démo. */
export function demoId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}
