// Questionnaire de clôture d'un AUDIT LIBRE (audit sans référentiel/template
// rattaché). Volontairement NEUTRE et transverse : il ne fait référence à aucun
// métier précis (ni rayon, ni DLC, ni froid). Les audits métier passent, eux,
// par leur template dédié (ProfessionalAuditModal). Chaque réponse « Non
// conforme » baisse le score et crée automatiquement une action corrective.
export const AUDIT_QUESTIONS = [
  'Le point contrôlé est conforme aux exigences attendues',
  'La zone contrôlée est propre et correctement rangée',
  'Aucun risque de sécurité immédiat n’est constaté',
  'Aucune anomalie nécessitant une intervention n’est relevée',
  'Les éléments de preuve (photo, relevé) sont disponibles si nécessaire',
  'Les consignes et l’affichage applicables à la zone sont respectés',
] as const;
