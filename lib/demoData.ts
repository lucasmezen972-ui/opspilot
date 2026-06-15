import type {
  ActivityEvent,
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

/**
 * Bibliothèque de modèles d'audit prêts à l'emploi (au-delà des 3 modèles
 * « socle » HACCP / Hygiène / Sécurité). Source unique consommée par
 * getDemoAuditTemplates (métadonnées) et getDemoAuditTemplateItems (critères).
 */
type ExtraAuditTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  duration: number;
  items: {
    section: string;
    question: string;
    type: AuditTemplateItem['item_type'];
    points: number;
    required?: boolean;
  }[];
};

const EXTRA_AUDIT_TEMPLATES: ExtraAuditTemplate[] = [
  {
    id: 'demo-template-froid',
    name: 'Chaîne du froid',
    description:
      'Contrôle de la continuité du froid : enceintes, relevés de température, rangement et réaction aux ruptures.',
    category: 'Qualité',
    icon: 'thermometer-snowflake',
    duration: 25,
    items: [
      {
        section: 'Enceintes',
        question:
          'Les températures des meubles froids sont-elles dans les seuils (0 à +4 °C frais, -18 °C surgelés) ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Enceintes',
        question:
          'Les meubles ne sont-ils pas surchargés (circulation de l’air) ?',
        type: 'score_1_5',
        points: 15,
      },
      {
        section: 'Relevés',
        question:
          'Les relevés de température sont-ils consignés au moins 2 fois par jour ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Rangement',
        question:
          'Produits crus en bas, prêts à consommer en haut, marche en avant respectée ?',
        type: 'score_1_5',
        points: 15,
      },
      {
        section: 'Réaction',
        question:
          'Une procédure de rupture de froid est-elle affichée et connue de l’équipe ?',
        type: 'yes_no',
        points: 15,
      },
      {
        section: 'Preuve',
        question:
          'Photographier le relevé de température ou l’afficheur de l’enceinte.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-dlc',
    name: 'DLC / DDM & rotation',
    description:
      'Maîtrise des dates de consommation, rotation FEFO, retrait des produits dépassés et registre de démarque.',
    category: 'Qualité',
    icon: 'calendar-clock',
    duration: 20,
    items: [
      {
        section: 'Contrôle',
        question:
          'Le contrôle des dates est-il réalisé selon la fréquence du rayon ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Rotation',
        question:
          'La rotation FEFO est-elle appliquée (dates courtes devant) ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Retrait',
        question: 'Aucun produit à DLC dépassée n’est présent en rayon ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Produits entamés',
        question: 'Les produits entamés portent-ils une date d’ouverture ?',
        type: 'yes_no',
        points: 15,
      },
      {
        section: 'Registre',
        question: 'Le registre de démarque/retraits est-il tenu à jour ?',
        type: 'score_1_5',
        points: 10,
      },
      {
        section: 'Preuve',
        question: 'Photographier un cas de date courte ou la zone de démarque.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-reception',
    name: 'Réception marchandises',
    description:
      'Contrôle à quai : conformité des livraisons, températures, DLC, intégrité des emballages et traçabilité.',
    category: 'Logistique',
    icon: 'truck',
    duration: 25,
    items: [
      {
        section: 'Quai',
        question:
          'Le quai et la zone de réception sont-ils propres et dégagés ?',
        type: 'score_1_5',
        points: 10,
      },
      {
        section: 'Contrôle',
        question:
          'La température des produits réfrigérés/surgelés est-elle relevée à réception ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Contrôle',
        question: 'Les DLC restantes sont-elles suffisantes à l’acceptation ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Emballages',
        question: 'L’intégrité des emballages et palettes est-elle vérifiée ?',
        type: 'score_1_5',
        points: 15,
      },
      {
        section: 'Traçabilité',
        question: 'Les bons de livraison et lots sont-ils enregistrés ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Non-conformité',
        question: 'Observations sur les refus/réserves émis à la livraison.',
        type: 'text',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-frais',
    name: 'Rayon frais & crémerie',
    description:
      'Tenue du rayon frais : propreté des meubles, fraîcheur, balisage, rotation et hygiène de manipulation.',
    category: 'Rayon',
    icon: 'milk',
    duration: 20,
    items: [
      {
        section: 'Meubles',
        question:
          'Les meubles réfrigérés sont-ils propres et sans givre excessif ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Fraîcheur',
        question: 'Les produits présentent-ils un aspect frais et conforme ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Rotation',
        question:
          'La rotation est-elle assurée (pas de produits oubliés au fond) ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Balisage',
        question: 'Le balisage prix et allergènes est-il complet et lisible ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Hygiène',
        question: 'Le personnel respecte-t-il les règles de manipulation ?',
        type: 'score_1_5',
        points: 10,
      },
      {
        section: 'Preuve',
        question: 'Photographier l’état général du rayon.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-fl',
    name: 'Fruits & légumes',
    description:
      'Qualité et présentation du rayon fruits et légumes : fraîcheur, tri, balisage origine et propreté.',
    category: 'Rayon',
    icon: 'apple',
    duration: 20,
    items: [
      {
        section: 'Qualité',
        question:
          'Les produits sont-ils frais, triés et sans éléments abîmés ?',
        type: 'score_1_5',
        points: 25,
      },
      {
        section: 'Tri',
        question:
          'Le tri des produits non vendables est-il effectué régulièrement ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Balisage',
        question:
          'L’origine, la variété et la catégorie sont-elles affichées ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Présentation',
        question: 'La présentation est-elle abondante et soignée ?',
        type: 'score_1_5',
        points: 15,
      },
      {
        section: 'Propreté',
        question: 'Le rayon et les bacs sont-ils propres ?',
        type: 'score_1_5',
        points: 10,
      },
      {
        section: 'Preuve',
        question: 'Photographier la table fruits et légumes.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-boulangerie',
    name: 'Boulangerie / pâtisserie',
    description:
      'Contrôle du fournil et de la vitrine : hygiène, cuissons, traçabilité allergènes et étiquetage.',
    category: 'Métier',
    icon: 'croissant',
    duration: 25,
    items: [
      {
        section: 'Hygiène',
        question: 'Le fournil et les plans de travail sont-ils propres ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Cuisson',
        question:
          'Les cuissons et refroidissements respectent-ils les procédures ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Allergènes',
        question: 'L’information allergènes est-elle disponible et à jour ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Vitrine',
        question:
          'La vitrine est-elle propre, attractive et correctement balisée ?',
        type: 'score_1_5',
        points: 15,
      },
      {
        section: 'Traçabilité',
        question: 'L’étiquetage des produits (DLC, lot) est-il conforme ?',
        type: 'yes_no',
        points: 10,
      },
      {
        section: 'Preuve',
        question: 'Photographier la vitrine ou le plan de travail.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-boucherie',
    name: 'Boucherie',
    description:
      'Hygiène boucherie : chaîne du froid, séparation des viandes, nettoyage du matériel et traçabilité.',
    category: 'Métier',
    icon: 'beef',
    duration: 30,
    items: [
      {
        section: 'Froid',
        question:
          'La température du laboratoire et des vitrines est-elle conforme ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Séparation',
        question:
          'La séparation des viandes (espèces, cru/préparé) est-elle respectée ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Matériel',
        question:
          'Le nettoyage/désinfection des couteaux, planches et scies est-il assuré ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Traçabilité',
        question:
          'La traçabilité des viandes (origine, lot) est-elle assurée ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Tenue',
        question: 'La tenue et l’hygiène du personnel sont-elles conformes ?',
        type: 'score_1_5',
        points: 5,
      },
      {
        section: 'Preuve',
        question: 'Photographier la vitrine ou le laboratoire.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-poissonnerie',
    name: 'Poissonnerie',
    description:
      'Fraîcheur et hygiène poissonnerie : glace, étalage, traçabilité, affichage origine et nettoyage.',
    category: 'Métier',
    icon: 'fish',
    duration: 25,
    items: [
      {
        section: 'Fraîcheur',
        question:
          'Les produits présentent-ils les critères de fraîcheur (œil, odeur, brillance) ?',
        type: 'score_1_5',
        points: 25,
      },
      {
        section: 'Glace',
        question:
          'L’étal est-il suffisamment glacé et les produits maintenus au froid ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Traçabilité',
        question:
          'L’origine, la zone de pêche et la dénomination sont-elles affichées ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Hygiène',
        question: 'Le nettoyage de l’étal et du matériel est-il régulier ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Tenue',
        question: 'La tenue et l’hygiène du personnel sont-elles conformes ?',
        type: 'score_1_5',
        points: 5,
      },
      {
        section: 'Preuve',
        question: 'Photographier l’étal réfrigéré.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-caisse',
    name: 'Caisse & encaissement',
    description:
      'Contrôle des postes de caisse : fonds, procédures d’encaissement, propreté, sécurité et accueil.',
    category: 'Caisse',
    icon: 'credit-card',
    duration: 20,
    items: [
      {
        section: 'Ouverture',
        question: 'Le fond de caisse est-il compté et signé à l’ouverture ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Procédures',
        question:
          'Les procédures d’encaissement et de rendu de monnaie sont-elles respectées ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Sécurité',
        question:
          'Les annulations/remboursements > seuil sont-ils validés par un responsable ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Accueil',
        question:
          'L’accueil client en caisse est-il conforme (salutation, sourire) ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Tenue',
        question: 'Les postes de caisse sont-ils propres et rangés ?',
        type: 'score_1_5',
        points: 10,
      },
      {
        section: 'Observation',
        question: 'Remarques sur les files d’attente ou incidents constatés.',
        type: 'text',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-prix',
    name: 'Affichage prix & étiquetage',
    description:
      'Conformité de l’affichage des prix : concordance rayon/caisse, lisibilité, promotions et mentions légales.',
    category: 'Conformité',
    icon: 'tag',
    duration: 20,
    items: [
      {
        section: 'Concordance',
        question: 'Les prix affichés correspondent-ils aux prix en caisse ?',
        type: 'yes_no',
        points: 30,
      },
      {
        section: 'Lisibilité',
        question:
          'Les étiquettes sont-elles présentes, lisibles et bien positionnées ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Prix au litre/kilo',
        question: 'Le prix à l’unité de mesure est-il affiché quand requis ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Promotions',
        question:
          'Les promotions affichées sont-elles valides et correctement balisées ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Preuve',
        question: 'Photographier une étiquette non conforme le cas échéant.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-ouverture',
    name: 'Ouverture magasin',
    description:
      'Check-list d’ouverture : sécurité, propreté, disponibilité produits, balisage et préparation des équipes.',
    category: 'Exploitation',
    icon: 'sunrise',
    duration: 15,
    items: [
      {
        section: 'Sécurité',
        question:
          'Les issues, éclairages et systèmes de sécurité sont-ils opérationnels ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Propreté',
        question: 'Le magasin est-il propre et prêt à accueillir les clients ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Rayons',
        question: 'Les rayons prioritaires sont-ils réassortis et balisés ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Caisses',
        question:
          'Les caisses sont-elles ouvertes avec fond et personnel prêt ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Briefing',
        question: 'Le briefing d’équipe a-t-il été réalisé ?',
        type: 'yes_no',
        points: 15,
      },
    ],
  },
  {
    id: 'demo-template-fermeture',
    name: 'Fermeture magasin',
    description:
      'Check-list de fermeture : encaissements, froid, sécurité, propreté et fermeture des accès.',
    category: 'Exploitation',
    icon: 'moon',
    duration: 15,
    items: [
      {
        section: 'Caisses',
        question: 'Les caisses sont-elles clôturées et les fonds sécurisés ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Froid',
        question:
          'Les meubles froids et chambres sont-ils fermés et conformes ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Sécurité',
        question:
          'Les accès, alarmes et éclairages de sécurité sont-ils activés ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Propreté',
        question: 'Le magasin et les réserves sont-ils nettoyés et rangés ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Observation',
        question: 'Incidents ou points à transmettre à l’équipe du lendemain.',
        type: 'text',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-reserve',
    name: 'Réserve & stockage',
    description:
      'Organisation de la réserve : rangement, marche en avant, propreté, sécurité et gestion des stocks.',
    category: 'Logistique',
    icon: 'warehouse',
    duration: 20,
    items: [
      {
        section: 'Rangement',
        question: 'La réserve est-elle rangée et les allées dégagées ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Stockage',
        question: 'Rien n’est stocké à même le sol (palettes/rayonnages) ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Rotation',
        question:
          'La rotation des stocks (FEFO) est-elle appliquée en réserve ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Propreté',
        question: 'La réserve est-elle propre et sans traces de nuisibles ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Sécurité',
        question: 'Les charges en hauteur et le matériel sont-ils sécurisés ?',
        type: 'score_1_5',
        points: 5,
      },
      {
        section: 'Preuve',
        question: 'Photographier l’état général de la réserve.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-proprete',
    name: 'Propreté magasin',
    description:
      'État de propreté général : sols, sanitaires, vitrines, mobilier et plan de nettoyage.',
    category: 'Hygiène',
    icon: 'broom',
    duration: 15,
    items: [
      {
        section: 'Sols',
        question: 'Les sols de la surface de vente sont-ils propres et secs ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Sanitaires',
        question:
          'Les sanitaires (clients/personnel) sont-ils propres et approvisionnés ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Mobilier',
        question: 'Le mobilier, vitres et entrées sont-ils propres ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Plan de nettoyage',
        question: 'Le plan de nettoyage est-il affiché et émargé ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Preuve',
        question: 'Photographier une zone à corriger le cas échéant.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-visite',
    name: 'Préparation visite régionale',
    description:
      'Pré-audit avant visite de la direction régionale : conformité globale, KPI, affichages et points sensibles.',
    category: 'Direction',
    icon: 'clipboard-check',
    duration: 30,
    items: [
      {
        section: 'Conformité',
        question: 'Les non-conformités connues ont-elles été traitées ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Affichages',
        question: 'Les affichages obligatoires sont-ils complets et à jour ?',
        type: 'score_1_5',
        points: 15,
      },
      {
        section: 'Tenue magasin',
        question:
          'La tenue générale (propreté, balisage, ruptures) est-elle conforme ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Documents',
        question:
          'Les registres (sécurité, températures, formations) sont-ils disponibles ?',
        type: 'yes_no',
        points: 20,
      },
      {
        section: 'Points sensibles',
        question: 'Points de vigilance identifiés avant la visite.',
        type: 'text',
        points: 10,
        required: false,
      },
      {
        section: 'Preuve',
        question: 'Photographier les zones préparées pour la visite.',
        type: 'photo',
        points: 10,
        required: false,
      },
    ],
  },
  {
    id: 'demo-template-franchise',
    name: 'Conformité franchise',
    description:
      'Respect du concept franchiseur : identité visuelle, gammes obligatoires, procédures et standards de service.',
    category: 'Franchise',
    icon: 'badge-check',
    duration: 30,
    items: [
      {
        section: 'Identité',
        question:
          'L’identité visuelle (enseigne, PLV, mobilier) respecte-t-elle la charte ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Gammes',
        question: 'Les gammes et assortiments obligatoires sont-ils présents ?',
        type: 'yes_no',
        points: 25,
      },
      {
        section: 'Procédures',
        question:
          'Les procédures du concept sont-elles appliquées par l’équipe ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Service',
        question:
          'Les standards de service client du réseau sont-ils respectés ?',
        type: 'score_1_5',
        points: 20,
      },
      {
        section: 'Documents',
        question:
          'Le manuel du franchisé et les mises à jour sont-ils disponibles ?',
        type: 'yes_no',
        points: 5,
      },
      {
        section: 'Observation',
        question: 'Écarts au concept relevés et plan de mise en conformité.',
        type: 'text',
        points: 10,
        required: false,
      },
    ],
  },
];

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
      'Audit complet des points critiques de sécurité alimentaire : réception, stockage, cuisson, hygiène, traçabilité et nettoyage.',
      'HACCP',
      'shield-check',
      45,
    ),
    template(
      'demo-template-hygiene',
      'Hygiène générale',
      'Contrôle approfondi du personnel, des locaux, des équipements, des nuisibles et de la gestion des déchets.',
      'Hygiène',
      'sparkles',
      35,
    ),
    template(
      'demo-template-securite',
      'Sécurité incendie & ERP',
      'Vérification des équipements de sécurité, issues de secours, affichages obligatoires et registre de sécurité.',
      'Sécurité',
      'shield-alert',
      30,
    ),
    ...EXTRA_AUDIT_TEMPLATES.map((t) =>
      template(t.id, t.name, t.description, t.category, t.icon, t.duration),
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
    // ── HACCP alimentaire ───────────────────────────────────────────────
    item(
      'demo-haccp-item-1',
      'demo-template-haccp',
      'Réception',
      'La température des produits frais est-elle conforme ?',
      'yes_no',
      20,
      1,
    ),
    item(
      'demo-haccp-item-2',
      'demo-template-haccp',
      'Réception',
      'Évaluer la propreté de la zone de réception.',
      'score_1_5',
      15,
      2,
    ),
    item(
      'demo-haccp-item-6',
      'demo-template-haccp',
      'Réception',
      'Les bons de livraison et numéros de lot sont-ils enregistrés ?',
      'yes_no',
      15,
      3,
    ),
    item(
      'demo-haccp-item-3',
      'demo-template-haccp',
      'Stockage',
      'La séparation cru, cuit et allergènes est-elle respectée ?',
      'yes_no',
      20,
      4,
    ),
    item(
      'demo-haccp-item-7',
      'demo-template-haccp',
      'Stockage',
      'Les températures des enceintes froides sont-elles relevées et conformes ?',
      'yes_no',
      20,
      5,
    ),
    item(
      'demo-haccp-item-8',
      'demo-template-haccp',
      'Stockage',
      'Le stockage respecte-t-il la marche en avant (rien à même le sol) ?',
      'yes_no',
      15,
      6,
    ),
    item(
      'demo-haccp-item-4',
      'demo-template-haccp',
      'Stockage',
      'Photographier la zone de stockage contrôlée.',
      'photo',
      10,
      7,
      false,
    ),
    item(
      'demo-haccp-item-9',
      'demo-template-haccp',
      'Préparation & cuisson',
      'Les températures de cuisson sont-elles contrôlées et tracées ?',
      'yes_no',
      20,
      8,
    ),
    item(
      'demo-haccp-item-10',
      'demo-template-haccp',
      'Préparation & cuisson',
      'Évaluer la maîtrise du refroidissement rapide des préparations.',
      'score_1_5',
      15,
      9,
    ),
    item(
      'demo-haccp-item-11',
      'demo-template-haccp',
      'Hygiène du personnel',
      'Le personnel porte-t-il une tenue complète et propre (charlotte, blouse) ?',
      'yes_no',
      15,
      10,
    ),
    item(
      'demo-haccp-item-12',
      'demo-template-haccp',
      'Hygiène du personnel',
      'Évaluer les pratiques de lavage des mains.',
      'score_1_5',
      15,
      11,
    ),
    item(
      'demo-haccp-item-13',
      'demo-template-haccp',
      'Traçabilité & DLC',
      'Les DLC des produits en rayon sont-elles toutes conformes ?',
      'yes_no',
      20,
      12,
    ),
    item(
      'demo-haccp-item-14',
      'demo-template-haccp',
      'Traçabilité & DLC',
      "Les produits entamés sont-ils étiquetés avec leur date d'ouverture ?",
      'yes_no',
      15,
      13,
    ),
    item(
      'demo-haccp-item-15',
      'demo-template-haccp',
      'Nettoyage',
      'Le plan de nettoyage et de désinfection est-il à jour et signé ?',
      'yes_no',
      15,
      14,
    ),
    item(
      'demo-haccp-item-16',
      'demo-template-haccp',
      'Nettoyage',
      'Évaluer la propreté générale du matériel et des surfaces.',
      'score_1_5',
      15,
      15,
    ),
    item(
      'demo-haccp-item-5',
      'demo-template-haccp',
      'Conclusion',
      'Observations complémentaires.',
      'text',
      10,
      16,
      false,
    ),
    // ── Hygiène générale ────────────────────────────────────────────────
    item(
      'demo-hygiene-item-1',
      'demo-template-hygiene',
      'Personnel',
      'Les tenues de travail sont-elles propres et adaptées ?',
      'yes_no',
      20,
      1,
    ),
    item(
      'demo-hygiene-item-2',
      'demo-template-hygiene',
      'Personnel',
      'Évaluer les pratiques de lavage des mains.',
      'score_1_5',
      15,
      2,
    ),
    item(
      'demo-hygiene-item-6',
      'demo-template-hygiene',
      'Personnel',
      'Les visiteurs et intervenants extérieurs respectent-ils les consignes ?',
      'yes_no',
      10,
      3,
    ),
    item(
      'demo-hygiene-item-3',
      'demo-template-hygiene',
      'Locaux',
      'Les sols et surfaces sont-ils propres ?',
      'yes_no',
      20,
      4,
    ),
    item(
      'demo-hygiene-item-7',
      'demo-template-hygiene',
      'Locaux',
      "Les points d'eau et lave-mains sont-ils fonctionnels et approvisionnés ?",
      'yes_no',
      15,
      5,
    ),
    item(
      'demo-hygiene-item-4',
      'demo-template-hygiene',
      'Locaux',
      'Photographier la zone contrôlée.',
      'photo',
      10,
      6,
      false,
    ),
    item(
      'demo-hygiene-item-8',
      'demo-template-hygiene',
      'Équipements',
      'Le matériel de découpe et les ustensiles sont-ils en bon état et propres ?',
      'yes_no',
      15,
      7,
    ),
    item(
      'demo-hygiene-item-9',
      'demo-template-hygiene',
      'Équipements',
      "Évaluer l'état des joints et surfaces des équipements froids.",
      'score_1_5',
      15,
      8,
    ),
    item(
      'demo-hygiene-item-10',
      'demo-template-hygiene',
      'Lutte anti-nuisibles',
      'Les dispositifs anti-nuisibles sont-ils en place et contrôlés ?',
      'yes_no',
      15,
      9,
    ),
    item(
      'demo-hygiene-item-11',
      'demo-template-hygiene',
      'Déchets',
      'Les déchets sont-ils triés, couverts et évacués régulièrement ?',
      'yes_no',
      15,
      10,
    ),
    item(
      'demo-hygiene-item-5',
      'demo-template-hygiene',
      'Conclusion',
      'Préciser les améliorations recommandées.',
      'text',
      10,
      11,
      false,
    ),
    // ── Sécurité incendie & ERP ─────────────────────────────────────────
    item(
      'demo-securite-item-1',
      'demo-template-securite',
      'Issues & dégagements',
      'Les issues de secours sont-elles dégagées et signalées ?',
      'yes_no',
      25,
      1,
    ),
    item(
      'demo-securite-item-2',
      'demo-template-securite',
      'Issues & dégagements',
      'Les blocs de secours (BAES) sont-ils fonctionnels ?',
      'yes_no',
      20,
      2,
    ),
    item(
      'demo-securite-item-3',
      'demo-template-securite',
      'Moyens de secours',
      'Les extincteurs sont-ils présents, accessibles et sous contrôle valide ?',
      'yes_no',
      25,
      3,
    ),
    item(
      'demo-securite-item-4',
      'demo-template-securite',
      'Moyens de secours',
      'Évaluer la connaissance des consignes incendie par le personnel.',
      'score_1_5',
      15,
      4,
    ),
    item(
      'demo-securite-item-5',
      'demo-template-securite',
      'Affichages & registre',
      "Le plan d'évacuation et les consignes sont-ils affichés ?",
      'yes_no',
      20,
      5,
    ),
    item(
      'demo-securite-item-6',
      'demo-template-securite',
      'Affichages & registre',
      'Le registre de sécurité est-il tenu à jour ?',
      'yes_no',
      20,
      6,
    ),
    item(
      'demo-securite-item-7',
      'demo-template-securite',
      'Affichages & registre',
      'Photographier le point de contrôle (extincteur, issue, affichage).',
      'photo',
      10,
      7,
      false,
    ),
    item(
      'demo-securite-item-8',
      'demo-template-securite',
      'Conclusion',
      'Observations et actions de mise en conformité recommandées.',
      'text',
      10,
      8,
      false,
    ),
    ...EXTRA_AUDIT_TEMPLATES.flatMap((tpl) =>
      tpl.items.map((it, index) =>
        item(
          `${tpl.id}-item-${index + 1}`,
          tpl.id,
          it.section,
          it.question,
          it.type,
          it.points,
          index + 1,
          it.required ?? true,
        ),
      ),
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
      35,
      50,
    ),
    t(
      'demo-training-2',
      'Gestion des DLC et rotation des stocks',
      'Qualité',
      'beginner',
      25,
      30,
    ),
    t(
      'demo-training-3',
      'Chaîne du froid : bonnes pratiques',
      'Qualité',
      'intermediate',
      30,
      40,
    ),
    t(
      'demo-training-4',
      'Accueil client et gestion des réclamations',
      'Relation client',
      'intermediate',
      40,
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
        "# Objectif pédagogique\n\nÀ la fin de ce chapitre, vous saurez expliquer ce qu'est la méthode HACCP et citer ses 7 principes.\n\n# Définition\n\nHACCP (Hazard Analysis Critical Control Points) est une méthode obligatoire qui consiste à identifier, évaluer et maîtriser les dangers qui menacent la sécurité des aliments.\n\n# Les 3 familles de dangers\n\n- Biologiques : bactéries (salmonelle, listeria), virus, moisissures\n- Chimiques : résidus de produits de nettoyage, allergènes, pesticides\n- Physiques : verre, métal, plastique, cheveux\n\n# Les 7 principes\n\n1. Analyser les dangers\n2. Déterminer les points critiques (CCP)\n3. Fixer les seuils critiques\n4. Mettre en place la surveillance\n5. Définir les actions correctives\n6. Vérifier le système\n7. Enregistrer et documenter\n\n# Règle d'or\n\nUn CCP est une étape où la maîtrise est essentielle : la cuisson, le froid ou le nettoyage en sont des exemples typiques.",
      ],
      [
        'Hygiène personnelle et tenue',
        "# Objectif pédagogique\n\nAdopter les gestes d'hygiène individuelle qui protègent le consommateur.\n\n# Le lavage des mains\n\nC'est la première barrière contre la contamination. Lavez-vous les mains :\n\n- En arrivant en zone de production\n- Après être passé aux toilettes\n- Après avoir manipulé des déchets ou des emballages\n- Entre la manipulation de produits crus et prêts à consommer\n\n# Technique en 6 étapes\n\n1. Mouiller et savonner\n2. Frotter paumes, dos, entre les doigts et ongles\n3. Pendant au moins 30 secondes\n4. Rincer abondamment\n5. Sécher avec un essuie-mains à usage unique\n6. Fermer le robinet avec l'essuie-mains\n\n# Tenue de travail\n\n- Blouse ou tablier propre, changé quotidiennement\n- Charlotte couvrant l'ensemble des cheveux\n- Aucun bijou, ni montre, ni vernis\n- Plaies couvertes par un pansement étanche et coloré",
      ],
      [
        'Maîtriser les contaminations croisées',
        "# Objectif pédagogique\n\nComprendre comment un germe passe d'un produit à un autre et l'empêcher.\n\n# Qu'est-ce qu'une contamination croisée ?\n\nC'est le transfert de microbes d'un aliment contaminé (souvent cru) vers un aliment sain, directement ou via un support : mains, planche, couteau, torchon.\n\n# La règle de la marche en avant\n\nLes produits doivent toujours avancer du sale vers le propre, sans jamais revenir en arrière : réception → stockage → préparation → cuisson → service.\n\n# Bonnes pratiques\n\n- Matériel et planches de couleurs dédiées (rouge = viande, bleu = poisson, vert = légumes)\n- Ne jamais poser un produit cru au-dessus d'un produit prêt à consommer\n- Nettoyer et désinfecter le plan de travail entre deux tâches\n- Respecter la séparation des allergènes\n\n# Erreur fréquente\n\nUtiliser le même couteau pour le poulet cru puis pour trancher du fromage, sans nettoyage intermédiaire : c'est la cause n°1 des toxi-infections.",
      ],
      [
        'Tracer, réagir et enregistrer',
        "# Objectif pédagogique\n\nSavoir réagir face à un produit douteux et assurer la traçabilité.\n\n# La traçabilité\n\nElle permet de retrouver l'origine et le parcours d'un produit. Chaque lot est identifié par un numéro qui doit être conservé jusqu'à la fin de vie du produit.\n\n# Conduite à tenir face à un produit douteux\n\n1. Isoler immédiatement le produit (zone identifiée \"non conforme\")\n2. Ne pas le remettre en vente ni le jeter sans décision\n3. Noter le constat : référence, lot, date, anomalie\n4. Alerter le responsable\n5. Appliquer et enregistrer l'action corrective\n\n# Les enregistrements obligatoires\n\n- Relevés de température (réception, enceintes froides)\n- Plan de nettoyage et désinfection signé\n- Suivi des non-conformités et actions correctives\n\n# À retenir\n\nUne action non enregistrée est considérée comme non réalisée lors d'un contrôle officiel.",
      ],
    ],
    'demo-training-2': [
      [
        'DLC, DDM et produits entamés',
        '# Objectif pédagogique\n\nDistinguer les types de dates et connaître leurs conséquences.\n\n# DLC — Date Limite de Consommation\n\nMention "À consommer jusqu\'au". Elle concerne la SÉCURITÉ. Un produit dont la DLC est dépassée est impropre à la vente et doit être retiré : produits frais, viandes, plats préparés, lait frais.\n\n# DDM — Date de Durabilité Minimale\n\nMention "À consommer de préférence avant". Elle concerne la QUALITÉ (goût, texture). Au-delà, le produit reste consommable mais peut perdre ses qualités : conserves, pâtes, biscuits.\n\n# Produits entamés\n\nUne fois ouvert, un produit suit la durée indiquée par le fabricant ("à consommer dans les 3 jours après ouverture"), même si la DLC d\'origine est plus lointaine. Étiquetez la date d\'ouverture.\n\n# Tableau de synthèse\n\n- DLC dépassée → retrait obligatoire\n- DDM dépassée → vente possible selon politique magasin\n- Produit entamé → durée après ouverture prioritaire',
      ],
      [
        'FIFO et FEFO : organiser la rotation',
        "# Objectif pédagogique\n\nAppliquer les règles de rotation pour limiter les pertes.\n\n# FIFO — First In, First Out\n\nPremier entré, premier sorti. On écoule d'abord la marchandise reçue en premier.\n\n# FEFO — First Expired, First Out\n\nPremier expiré, premier sorti. On écoule en priorité ce qui périme le plus tôt. C'est la règle reine en grande distribution alimentaire.\n\n# Mise en pratique au rayon\n\n1. Lors du réassort, retirer les produits déjà en rayon\n2. Placer la nouvelle marchandise derrière\n3. Remettre devant les produits aux dates les plus courtes\n4. Vérifier qu'aucune date dépassée ne subsiste\n\n# Bénéfices\n\n- Moins de démarque (produits jetés)\n- Meilleure fraîcheur perçue par le client\n- Respect de la réglementation\n\n# Erreur fréquente\n\nRemplir le rayon \"par-dessus\" sans retirer l'ancien stock : les produits du fond périment et génèrent des pertes invisibles.",
      ],
      [
        'Le contrôle quotidien des dates',
        '# Objectif pédagogique\n\nMettre en place une routine fiable de contrôle des dates.\n\n# Fréquence selon le rayon\n\n- Ultra-frais (viande, poisson, traiteur) : plusieurs fois par jour\n- Frais (crémerie, charcuterie) : chaque matin\n- Épicerie : hebdomadaire\n\n# La routine du matin\n\n1. Parcourir le rayon référence par référence\n2. Repérer les produits à J0 (périment aujourd\'hui) et J+1\n3. Appliquer la démarque ou la promotion anti-gaspillage si prévue\n4. Retirer et isoler les produits dépassés\n5. Consigner les retraits dans le registre\n\n# Les outils\n\n- Étiquettes "date courte" ou pastilles promotion\n- Registre de démarque\n- Application de relevé si disponible\n\n# Indicateur clé\n\nLe taux de démarque connue : il mesure l\'efficacité de la rotation. Un taux qui grimpe signale un problème de gestion des dates en amont.',
      ],
      [
        'Traiter une anomalie et lutter contre le gaspillage',
        "# Objectif pédagogique\n\nRéagir correctement face à un produit non conforme et valoriser l'invendu.\n\n# Procédure de retrait\n\n1. Retirer immédiatement le produit du rayon\n2. L'isoler dans la zone non conforme identifiée\n3. Enregistrer : référence, lot, date, quantité, motif\n4. Décider du devenir : destruction, retour fournisseur, don\n\n# Lutte anti-gaspillage\n\nAvant la péremption, plusieurs leviers existent :\n\n- Promotion \"date courte\" (-30 à -50 %)\n- Don aux associations habilitées (obligation légale au-delà d'une surface)\n- Transformation par le rayon traiteur quand c'est autorisé\n\n# Cadre réglementaire\n\nLa loi anti-gaspillage interdit la destruction des invendus alimentaires encore consommables pour les surfaces concernées : le don devient prioritaire.\n\n# À retenir\n\nUn produit retiré pour DLC dépassée ne doit JAMAIS réapparaître en rayon, ni être réétiqueté.",
      ],
    ],
    'demo-training-3': [
      [
        'Pourquoi la chaîne du froid est critique',
        "# Objectif pédagogique\n\nComprendre le rôle du froid dans la sécurité alimentaire.\n\n# Le froid ne tue pas, il ralentit\n\nLe froid bloque ou ralentit la multiplication des micro-organismes, mais ne les détruit pas. Dès que la température remonte, les bactéries reprennent leur croissance, parfois plus vite.\n\n# La zone de danger\n\nEntre +4 °C et +63 °C, les bactéries se multiplient rapidement. L'objectif est de faire passer les produits le moins de temps possible dans cette plage.\n\n# Les températures réglementaires\n\n- Produits très périssables (viande hachée, poisson) : 0 à +2 °C\n- Produits frais (crémerie, charcuterie) : +2 à +4 °C\n- Surgelés : -18 °C ou plus froid\n\n# La chaîne du froid\n\nC'est la continuité du froid de la production jusqu'au consommateur. Une seule rupture peut compromettre toute la chaîne. Chaque maillon (réception, stockage, transport, rayon) doit être maîtrisé.",
      ],
      [
        'Le contrôle à la réception',
        "# Objectif pédagogique\n\nContrôler une livraison de produits réfrigérés ou surgelés.\n\n# Avant de décharger\n\n1. Vérifier la température de la caisse du camion\n2. Contrôler l'aspect et l'intégrité des emballages\n3. Vérifier les DLC : refuser les dates trop courtes\n\n# La prise de température\n\n- Utiliser un thermomètre sonde désinfecté\n- Mesurer entre deux produits (jamais en plein cœur sans précaution)\n- Surgelés : refuser si > -15 °C, présence de givre ou de produits agglomérés\n\n# Les seuils d'acceptation\n\n- Frais : conforme jusqu'à +4 °C (tolérance courte selon produit)\n- Surgelé : conforme à -18 °C, refus au-delà de -15 °C\n\n# En cas de non-conformité\n\n1. Refuser le ou les produits concernés\n2. Le noter sur le bon de livraison\n3. Prévenir le responsable et le fournisseur\n4. Enregistrer le contrôle (température relevée, décision)\n\n# À retenir\n\nLe relevé de température à réception est une obligation : il doit être daté, chiffré et conservé.",
      ],
      [
        'Le stockage et la circulation du froid',
        "# Objectif pédagogique\n\nStocker correctement pour maintenir le froid.\n\n# Ne pas surcharger les enceintes\n\nL'air froid doit circuler librement. Un meuble ou une chambre froide surchargés créent des zones chaudes où les bactéries se développent.\n\n# Bonnes pratiques\n\n- Respecter les limites de chargement (ligne de gerbage)\n- Laisser un espace entre les produits et les parois\n- Garder les portes fermées le plus possible\n- Ne jamais stocker à même le sol\n\n# Organisation interne\n\n- Produits crus en bas, produits prêts à consommer en haut\n- Respect de la marche en avant et de la séparation des allergènes\n- Rotation FEFO appliquée aussi en réserve\n\n# Surveillance\n\n1. Relever les températures des enceintes au moins 2 fois par jour\n2. Consigner les relevés\n3. Réagir immédiatement en cas de dérive (alarme, température anormale)\n\n# Dégivrage et entretien\n\nUn givre épais isole l'évaporateur et fait monter la température : un entretien régulier est indispensable.",
      ],
      [
        'Réagir à une rupture de la chaîne du froid',
        "# Objectif pédagogique\n\nSavoir quoi faire quand le froid n'est plus assuré.\n\n# Détecter la rupture\n\n- Alarme de l'enceinte\n- Température relevée hors seuil\n- Panne électrique ou de groupe froid\n- Porte restée ouverte\n\n# Les bons réflexes\n\n1. Ne pas remettre les produits en vente sans décision\n2. Noter la température constatée ET la durée de l'incident\n3. Isoler les lots concernés en zone identifiée\n4. Alerter immédiatement le responsable\n\n# La décision sur le devenir des produits\n\nElle dépend du couple température / durée : un produit frais à +8 °C pendant 30 minutes n'a pas le même sort qu'à +12 °C pendant 4 heures. Seul le responsable, sur la base des relevés, tranche entre maintien, démarque ou destruction.\n\n# Documenter l'incident\n\nChaque rupture fait l'objet d'une fiche : date, enceinte, cause, durée, température, produits concernés, décision. C'est essentiel en cas de contrôle ou de rappel.\n\n# À retenir\n\nDans le doute, on protège le consommateur : un produit dont l'historique de froid n'est pas maîtrisé ne doit pas être vendu.",
      ],
    ],
    'demo-training-4': [
      [
        'Les premières secondes de la relation',
        "# Objectif pédagogique\n\nRéussir le premier contact avec le client.\n\n# La règle des 4x20\n\nLe client se forge une impression en quelques secondes. On soigne :\n\n- Les 20 premiers pas (posture, disponibilité)\n- Les 20 premiers centimètres (regard, sourire)\n- Les 20 premiers mots (formule d'accueil claire)\n- Les 20 premières secondes (ton, énergie)\n\n# Les gestes qui créent le contact\n\n- Regarder le client et le saluer le premier\n- Sourire sincèrement\n- Interrompre une tâche secondaire pour se rendre disponible\n- Adopter une posture ouverte\n\n# Les attitudes à bannir\n\n- Continuer une conversation entre collègues\n- Éviter le regard ou tourner le dos\n- Soupirer ou montrer de l'agacement\n\n# À retenir\n\nUn client bien accueilli pardonne plus facilement un imprévu. Le premier contact conditionne toute la suite de l'échange.",
      ],
      [
        "L'écoute active et la reformulation",
        '# Objectif pédagogique\n\nComprendre réellement la demande ou la réclamation du client.\n\n# Écouter sans interrompre\n\nLaissez le client exposer sa situation jusqu\'au bout. Couper la parole donne le sentiment de ne pas être pris au sérieux et fait monter la tension.\n\n# Les techniques d\'écoute active\n\n- Le silence : laisser un temps après la phrase du client\n- Les relances : "c\'est-à-dire ?", "que s\'est-il passé exactement ?"\n- La reformulation : "si je comprends bien, vous..."\n\n# Gérer l\'émotion d\'abord\n\nFace à un client mécontent, on traite l\'émotion avant le problème :\n\n1. Reconnaître le désagrément ("je comprends que ce soit gênant")\n2. Rester calme et ne pas se justifier à l\'excès\n3. Recentrer sur les faits\n\n# Vérifier la vraie attente\n\nLe client veut-il un remboursement, un échange, une explication, ou simplement être entendu ? Reformuler permet de viser juste plutôt que de proposer à côté.',
      ],
      [
        'Proposer et mettre en œuvre une solution',
        "# Objectif pédagogique\n\nApporter une réponse claire et tenable.\n\n# Une solution se formule précisément\n\nUne bonne réponse indique toujours :\n\n- L'action concrète qui sera réalisée\n- Le délai associé\n- La prochaine étape et qui s'en charge\n\n# Rester dans son périmètre\n\n- Ce que vous pouvez faire seul : le faire tout de suite\n- Ce qui dépasse votre autonomie : passer la main au responsable sans promettre à sa place\n\n# Le cas du litige qui persiste\n\n1. Ne pas s'enfermer dans un rapport de force\n2. Proposer une alternative ou un geste commercial cadré\n3. Faire intervenir le responsable si le désaccord demeure\n\n# Transformer un mécontentement en fidélité\n\nUn problème bien traité crée souvent plus de fidélité qu'une expérience sans accroc. Le client retient la qualité de la prise en charge.\n\n# À éviter\n\nPromettre ce qu'on ne pourra pas tenir : une promesse non tenue détruit la confiance plus sûrement que le problème initial.",
      ],
      [
        'Clore, tracer et capitaliser',
        "# Objectif pédagogique\n\nTerminer l'échange et faire progresser le magasin.\n\n# Bien clore l'échange\n\n1. Vérifier que le client est satisfait de la solution\n2. Le remercier pour son signalement\n3. Conclure positivement\n\n# Tracer la réclamation\n\nChaque réclamation significative est enregistrée : nature, produit ou rayon concerné, solution apportée. Sans trace, l'information se perd et le problème se répète.\n\n# Détecter les problèmes récurrents\n\nDes réclamations qui se répètent sur un même rayon ou un même produit signalent une cause de fond :\n\n- Rupture fréquente\n- Problème qualité fournisseur\n- Affichage prix erroné\n\n# La boucle d'amélioration\n\n1. Tracer les réclamations\n2. Analyser les récurrences en réunion\n3. Lancer une action corrective\n4. Vérifier la disparition du problème\n\n# À retenir\n\nLe client qui réclame est un allié : il signale gratuitement un dysfonctionnement que dix autres clients subissent en silence.",
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
  // Banques de questions par module : la difficulté et les questions critiques
  // alimentent le moteur anti-triche, qui tire 8 questions par tentative.
  type RichQ = {
    q: string;
    opts: string[];
    c: number;
    d: TrainingQuizQuestion['difficulty'];
    crit?: boolean;
    t?: TrainingQuizQuestion['question_type'];
  };
  const richModules: Record<string, RichQ[]> = {
    'demo-training-1': [
      {
        q: 'Que vise la méthode HACCP ?',
        opts: [
          'Identifier, évaluer et maîtriser les dangers alimentaires',
          'Décorer les locaux de vente',
          'Fixer les prix de vente',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Combien de principes compte la méthode HACCP ?',
        opts: ['7', '3', '12'],
        c: 0,
        d: 'easy',
      },
      {
        q: 'La méthode HACCP est obligatoire en distribution alimentaire.',
        opts: ['Vrai', 'Faux'],
        c: 0,
        d: 'easy',
        t: 'true_false',
      },
      {
        q: 'Pendant combien de temps faut-il frotter ses mains au minimum ?',
        opts: ['Au moins 30 secondes', '5 secondes', '2 minutes complètes'],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Quelle couleur de planche est dédiée à la viande crue ?',
        opts: ['Rouge', 'Bleu', 'Vert'],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Un éclat de verre dans un produit est un danger…',
        opts: ['Physique', 'Biologique', 'Chimique'],
        c: 0,
        d: 'medium',
      },
      {
        q: 'La salmonelle et la listeria sont des dangers…',
        opts: ['Biologiques', 'Chimiques', 'Physiques'],
        c: 0,
        d: 'medium',
      },
      {
        q: 'En quoi consiste la marche en avant ?',
        opts: [
          'Les produits avancent du sale vers le propre, sans retour en arrière',
          'Avancer les promotions chaque matin',
          'Un type de planning de production',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Que faire d’une coupure à la main avant de travailler ?',
        opts: [
          'La couvrir d’un pansement étanche et coloré',
          'La laisser à l’air libre',
          'Ne rien faire',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Vous tranchez du poulet cru puis, sans nettoyer le couteau, vous coupez du fromage. Quel est le risque ?',
        opts: [
          'Une contamination croisée, cause majeure de toxi-infection',
          'Aucun risque, c’est plus rapide',
          'Un meilleur rendement',
        ],
        c: 0,
        d: 'hard',
        crit: true,
        t: 'situation',
      },
      {
        q: 'Un produit vous paraît douteux. Quelle est la bonne première action ?',
        opts: [
          'L’isoler en zone non conforme et alerter le responsable',
          'Le jeter sans aucune trace',
          'Le remettre en vente',
        ],
        c: 0,
        d: 'hard',
        crit: true,
      },
      {
        q: 'Lors d’un contrôle officiel, une action corrective non enregistrée est considérée comme…',
        opts: ['Non réalisée', 'Valable malgré tout', 'Facultative'],
        c: 0,
        d: 'hard',
      },
    ],
    'demo-training-2': [
      {
        q: 'Que signifie la DLC ?',
        opts: [
          'Date Limite de Consommation, liée à la sécurité',
          'Date de livraison au client',
          'Durée de conservation sans limite',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'La mention « À consommer de préférence avant » correspond à…',
        opts: [
          'La DDM, liée à la qualité',
          'La DLC, liée à la sécurité',
          'Une date de promotion',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Un produit dont la DLC est dépassée doit être retiré de la vente.',
        opts: ['Vrai', 'Faux'],
        c: 0,
        d: 'easy',
        t: 'true_false',
      },
      {
        q: 'Que signifie FEFO ?',
        opts: [
          'Premier expiré, premier sorti',
          'Dernier entré, premier sorti',
          'Aucun contrôle des dates',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Où placer les produits aux dates les plus courtes en rayon ?',
        opts: ['Devant', 'Derrière', 'Peu importe'],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Que signifie FIFO ?',
        opts: [
          'Premier entré, premier sorti',
          'Premier expiré, premier sorti',
          'Premier vendu, premier payé',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Quelle est la règle reine de rotation en distribution alimentaire ?',
        opts: ['FEFO', 'FIFO strict', 'LIFO'],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Un produit entamé se conserve selon…',
        opts: [
          'La durée après ouverture indiquée par le fabricant',
          'La DLC d’origine uniquement',
          'Sans aucune limite',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Que mesure le taux de démarque connue ?',
        opts: [
          'L’efficacité de la rotation des dates',
          'Le chiffre d’affaires du rayon',
          'La satisfaction client',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'En réassort, vous remplissez le rayon par-dessus l’ancien stock sans le retirer. Conséquence ?',
        opts: [
          'Les produits du fond périment : des pertes invisibles',
          'Un gain de temps sans aucun risque',
          'Une meilleure fraîcheur perçue',
        ],
        c: 0,
        d: 'hard',
        t: 'situation',
      },
      {
        q: 'Un produit retiré pour DLC dépassée peut-il réapparaître en rayon après réétiquetage ?',
        opts: [
          'Jamais, c’est strictement interdit',
          'Oui si la qualité semble bonne',
          'Oui avec une promotion',
        ],
        c: 0,
        d: 'hard',
        crit: true,
      },
      {
        q: 'Que prévoit la loi anti-gaspillage pour les invendus alimentaires encore consommables ?',
        opts: [
          'Le don est prioritaire, la destruction est interdite',
          'La destruction est libre',
          'La vente reste obligatoire',
        ],
        c: 0,
        d: 'hard',
      },
    ],
    'demo-training-3': [
      {
        q: 'Le froid détruit tous les microbes.',
        opts: ['Faux', 'Vrai'],
        c: 0,
        d: 'easy',
        t: 'true_false',
      },
      {
        q: 'Quel est l’effet du froid sur les bactéries ?',
        opts: [
          'Il ralentit ou bloque leur multiplication',
          'Il les détruit toutes',
          'Il accélère leur croissance',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Quelle est la température de conservation des surgelés ?',
        opts: ['-18 °C ou plus froid', '0 °C', '+4 °C'],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Que contrôler en priorité à la réception de produits frais ?',
        opts: ['La température', 'La couleur du camion', 'Le prix'],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Pourquoi ne pas surcharger une enceinte froide ?',
        opts: [
          'Pour laisser circuler l’air froid',
          'Pour gagner du temps',
          'Pour réduire la lumière',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Quelle est la « zone de danger » de multiplication des bactéries ?',
        opts: [
          'Entre +4 °C et +63 °C',
          'En dessous de 0 °C',
          'Au-dessus de 100 °C',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'À partir de quelle température un surgelé est-il refusé à la réception ?',
        opts: [
          'Au-dessus de -15 °C',
          'Au-dessus de -25 °C',
          'Au-dessus de 0 °C',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'À quelle fréquence relever la température des enceintes froides ?',
        opts: ['Au moins 2 fois par jour', 'Une fois par semaine', 'Jamais'],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Comment ranger produits crus et produits prêts à consommer ?',
        opts: [
          'Crus en bas, prêts à consommer en haut',
          'Crus en haut, prêts à consommer en bas',
          'Peu importe l’ordre',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Une enceinte tombe en panne. Quel couple détermine le sort des produits ?',
        opts: [
          'La température constatée ET la durée de l’incident',
          'Uniquement la couleur du produit',
          'Le nombre de clients présents',
        ],
        c: 0,
        d: 'hard',
        t: 'situation',
      },
      {
        q: 'En cas de rupture de la chaîne du froid, que faire des produits concernés ?',
        opts: [
          'Les isoler et attendre la décision du responsable',
          'Les remettre en vente aussitôt',
          'Les jeter sans aucune trace',
        ],
        c: 0,
        d: 'hard',
        crit: true,
      },
      {
        q: 'Un givre épais sur l’évaporateur…',
        opts: [
          'Isole le froid et fait monter la température',
          'Améliore le refroidissement',
          'N’a aucun effet',
        ],
        c: 0,
        d: 'hard',
      },
    ],
    'demo-training-4': [
      {
        q: 'Que désigne la règle des 4x20 ?',
        opts: [
          'Les 20 premiers pas, centimètres, mots et secondes',
          'Une promotion à -20 %',
          'Un planning de 20 heures',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Quel geste crée un bon premier contact ?',
        opts: [
          'Saluer le client le premier avec un sourire',
          'Éviter son regard',
          'Continuer sa discussion entre collègues',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Couper la parole d’un client mécontent aide à le calmer.',
        opts: ['Faux', 'Vrai'],
        c: 0,
        d: 'easy',
        t: 'true_false',
      },
      {
        q: 'Pourquoi reformuler la demande du client ?',
        opts: [
          'Vérifier qu’on a bien compris son attente',
          'Gagner du temps',
          'Le contredire',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Une solution claire précise toujours…',
        opts: [
          'L’action concrète et le délai',
          'Uniquement les limites',
          'Rien de concret',
        ],
        c: 0,
        d: 'easy',
      },
      {
        q: 'Face à un client en colère, que traite-t-on en premier ?',
        opts: [
          'L’émotion avant le problème',
          'Le problème avant l’émotion',
          'Ni l’un ni l’autre',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Quelle est une technique d’écoute active ?',
        opts: [
          'La reformulation et les relances',
          'Interrompre poliment',
          'Hausser le ton',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Un sujet dépasse votre autonomie. Que faire ?',
        opts: [
          'Passer la main au responsable sans promettre à sa place',
          'Promettre quand même au client',
          'Ignorer la demande',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Comment bien clore un échange de réclamation ?',
        opts: [
          'Vérifier la satisfaction et remercier du signalement',
          'Partir sans rien dire',
          'Effacer la trace de l’échange',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Pourquoi tracer chaque réclamation significative ?',
        opts: [
          'Pour détecter les problèmes récurrents et corriger la cause',
          'Pour ralentir le service',
          'Pour la direction uniquement',
        ],
        c: 0,
        d: 'medium',
      },
      {
        q: 'Pour obtenir gain de cause vite, vous promettez un remboursement intenable. Conséquence ?',
        opts: [
          'Une promesse non tenue détruit la confiance',
          'Le client sera fidélisé',
          'Aucun impact',
        ],
        c: 0,
        d: 'hard',
        t: 'situation',
      },
      {
        q: 'Des réclamations répétées sur un même rayon signalent…',
        opts: [
          'Une cause de fond à corriger',
          'Un simple hasard sans importance',
          'Un très bon fonctionnement',
        ],
        c: 0,
        d: 'hard',
      },
    ],
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
        question_type: (e.t ??
          'qcm_single') as TrainingQuizQuestion['question_type'],
        is_critical: e.crit ?? false,
        created_at: days(-30),
        updated_at: days(-7),
      })),
  );

  return richEntries;
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
      status: 'completed',
      progress_percentage: 100,
      completed_chapter_ids: [
        'demo-training-2-chapter-1',
        'demo-training-2-chapter-2',
        'demo-training-2-chapter-3',
        'demo-training-2-chapter-4',
      ],
      score: 95,
      started_at: days(-8),
      completed_at: days(-7),
      created_at: days(-8),
      updated_at: days(-7),
    },
    {
      id: 'demo-progress-3',
      user_id: DEMO_USER_ID,
      training_id: 'demo-training-4',
      status: 'completed',
      progress_percentage: 100,
      completed_chapter_ids: [
        'demo-training-4-chapter-1',
        'demo-training-4-chapter-2',
        'demo-training-4-chapter-3',
        'demo-training-4-chapter-4',
      ],
      score: 84,
      started_at: days(-6),
      completed_at: days(-5),
      created_at: days(-6),
      updated_at: days(-5),
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

/** Journal d'activité de gouvernance (preuves d'exécution tracées). */
export function getDemoActivityLog(): ActivityEvent[] {
  const event = (
    id: string,
    action: ActivityEvent['action'],
    entityType: string,
    label: string,
    actorName: string,
    daysAgo: number,
  ): ActivityEvent => ({
    id,
    organization_id: DEMO_ORG_ID,
    actor_id: DEMO_USER_ID,
    actor_name: actorName,
    action,
    entity_type: entityType,
    entity_id: null,
    label,
    created_at: days(daysAgo),
  });

  return [
    event(
      'demo-activity-1',
      'audit_completed',
      'audit',
      'Audit « Contrôle hygiène rayon frais » clôturé (score 92 %).',
      'Marie Dupont',
      -1,
    ),
    event(
      'demo-activity-2',
      'action_resolved',
      'corrective_action',
      'Action corrective « Mettre à jour l’affichage allergènes » résolue.',
      'Emma Rousseau',
      -2,
    ),
    event(
      'demo-activity-3',
      'training_certified',
      'training',
      'Formation « Hygiène et sécurité alimentaire (HACCP) » validée.',
      'Jean Martin',
      -3,
    ),
    event(
      'demo-activity-4',
      'export',
      'report',
      'Export du rapport direction (Excel).',
      'Marie Dupont',
      -4,
    ),
  ];
}

/** Génère un identifiant local unique pour les créations en mode démo. */
export function demoId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}
