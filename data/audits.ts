export interface AuditPlan {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'in_progress' | 'completed';
  date: string;
  score: number | null;
  issues: number;
  objectives: string[];
  checklist: string[];
  responsible: string;
  resources: string[];
}

export const audits: AuditPlan[] = [
  {
    id: 'network-coverage',
    title: 'Audit du réseau de magasins',
    description:
      'Cartographie de la couverture et identification des zones à potentiel.',
    location: 'Siège',
    status: 'pending',
    date: '2024-01-20',
    score: null,
    issues: 0,
    objectives: [
      'Cartographier la couverture de chaque enseigne',
      'Analyser l\u2019\u00e9quilibre hypermarch\u00e9s/supermarch\u00e9s/proximit\u00e9',
      'Identifier les zones à potentiel',
    ],
    checklist: [
      "Collecter les donn\u00e9es d'implantation",
      'Mesurer la densité de magasins par région',
      'Repérer les zones blanches ou sous-performantes',
    ],
    responsible: 'Direction Expansion',
    resources: ['Données géomarketing', 'Rapports de ventes'],
  },
  {
    id: 'supply-chain',
    title: 'Audit supply chain et logistique',
    description: 'Evaluation des coûts de distribution et des taux de rupture.',
    location: 'Plateformes logistiques',
    status: 'in_progress',
    date: '2024-01-15',
    score: null,
    issues: 3,
    objectives: [
      'Evaluer les coûts de distribution',
      'Analyser les taux de rupture en magasin',
      "Mesurer l'efficacit\u00e9 des plateformes",
    ],
    checklist: [
      'Analyser les coûts transport et stockage',
      'Comparer les taux de rupture par canal',
      'V\u00e9rifier la ma\u00eetrise des flux omnicanaux',
    ],
    responsible: 'Direction Logistique',
    resources: ['ERP logistique', 'Historique des commandes'],
  },
  {
    id: 'digital-omnichannel',
    title: 'Audit digital et omnicanal',
    description:
      'Examen des sites e-commerce et de lintégration des données clients.',
    location: 'Canaux digitaux',
    status: 'pending',
    date: '2024-01-22',
    score: null,
    issues: 0,
    objectives: [
      'Examiner les sites e-commerce et applications',
      'Mesurer lintégration des données clients',
      'Evaluer les programmes de fidélité',
    ],
    checklist: [
      'Analyser le parcours utilisateur',
      'Vérifier la cohérence cross-canal',
      'Auditer la personnalisation marketing',
    ],
    responsible: 'Direction Digitale',
    resources: ['Analytics web', 'CRM'],
  },
  {
    id: 'rse-energy',
    title: 'Audit RSE et performance énergétique',
    description: 'Suivi des consommations et comparaison aux référentiels RSE.',
    location: 'Enseignes',
    status: 'completed',
    date: '2024-01-10',
    score: 88,
    issues: 1,
    objectives: [
      'Suivre consommation énergétique et recyclage',
      'Mesurer le gaspillage alimentaire',
      'Comparer aux normes ISO 14001',
    ],
    checklist: [
      'Collecter les factures d’énergie',
      'Contrôler les procédures de tri',
      'Réaliser le bilan carbone',
    ],
    responsible: 'Direction RSE',
    resources: ['Rapports énergétiques', 'Normes RSE'],
  },
];

export default audits;
