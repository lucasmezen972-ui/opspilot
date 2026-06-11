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
