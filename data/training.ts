export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xp_reward: number;
  ai_generated?: boolean;
  modules: { title: string; content: string }[];
}

export const courses: TrainingCourse[] = [
  {
    id: 'data-performance',
    title: 'Data & Performance magasin',
    description:
      'Initiation aux indicateurs (CA, fréquentation, panier moyen, marge) et automatisation des tableaux de bord.',
    duration_minutes: 30,
    progress: 0,
    status: 'not_started',
    difficulty: 'beginner',
    xp_reward: 50,
    ai_generated: false,
    modules: [
      {
        title: 'Indicateurs clés',
        content: 'Présentation des principaux KPI de la grande distribution.',
      },
      {
        title: 'Atelier BI',
        content: 'Automatisation des tableaux de bord avec Excel ou Power BI.',
      },
    ],
  },
  {
    id: 'agile-logistique',
    title: 'Logistique agile et optimisation des stocks',
    description:
      'Techniques de prévision de la demande et gestion des stocks de sécurité.',
    duration_minutes: 45,
    progress: 20,
    status: 'in_progress',
    difficulty: 'intermediate',
    xp_reward: 80,
    ai_generated: false,
    modules: [
      {
        title: 'Prévision de la demande',
        content: 'Méthodes qualitatives et quantitatives.',
      },
      {
        title: 'Flux omnicanaux',
        content: 'Simulation d\u2019un flux drive + magasin.',
      },
    ],
  },
  {
    id: 'omnicanal',
    title: 'Expérience client omnicanale',
    description:
      'Parcours client cross-canal et bonnes pratiques UX pour les applications de drive et de fidélité.',
    duration_minutes: 35,
    progress: 100,
    status: 'completed',
    difficulty: 'advanced',
    xp_reward: 100,
    ai_generated: false,
    modules: [
      {
        title: 'Parcours client',
        content: 'Analyse des points de contact en ligne et en magasin.',
      },
      {
        title: 'Personnalisation',
        content: 'Techniques de marketing personnalisé et CRM.',
      },
    ],
  },
  {
    id: 'durabilite',
    title: 'Durabilité en grande distribution',
    description:
      'Réglementations RSE et mise en œuvre de plans de réduction des déchets et d\u2019économie d\u2019énergie.',
    duration_minutes: 40,
    progress: 0,
    status: 'not_started',
    difficulty: 'beginner',
    xp_reward: 60,
    ai_generated: false,
    modules: [
      {
        title: 'Cadre réglementaire',
        content: 'Présentation des principales normes RSE.',
      },
      {
        title: 'Plan d\u2019action',
        content:
          'Étapes pour réduire les déchets et la consommation d\u2019énergie.',
      },
    ],
  },
];

export default courses;
