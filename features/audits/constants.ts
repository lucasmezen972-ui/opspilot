export const AUDIT_TEMPLATES = [
  {
    id: 't1',
    name: 'HACCP alimentaire',
    icon: '🧫',
    category: 'haccp',
    color: '#EFF6FF',
    accent: '#2563EB',
  },
  {
    id: 't2',
    name: 'Hygiène générale',
    icon: '🧹',
    category: 'hygiene',
    color: '#F0FDF4',
    accent: '#16A34A',
  },
  {
    id: 't3',
    name: 'Sécurité incendie',
    icon: '🔥',
    category: 'securite',
    color: '#FFF7ED',
    accent: '#EA580C',
  },
  {
    id: 't4',
    name: 'Contrôle DLC & qualité',
    icon: '📦',
    category: 'qualite',
    color: '#FEFCE8',
    accent: '#CA8A04',
  },
] as const;

// Questionnaire de clôture : chaque réponse « Non conforme » baisse le score
// et crée automatiquement une action corrective liée à l'audit.
export const AUDIT_QUESTIONS = [
  'Les zones de stockage sont propres et rangées',
  'Les températures des frigos/congélateurs sont conformes',
  'Les DLC des produits en rayon sont valides',
  'Le personnel respecte les règles d’hygiène (tenue, lavage des mains)',
  'Les allées et issues de secours sont dégagées',
  'L’affichage obligatoire (prix, allergènes) est à jour',
] as const;
