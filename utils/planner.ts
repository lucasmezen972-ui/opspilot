export interface ActionPlan {
  problem: string;
  steps: string[];
}

export interface AuditSuggestion {
  problem: string;
  checklist: string[];
}

export function generatePlanAndAudit(problem: string): {
  actionPlan: ActionPlan;
  audit: AuditSuggestion;
} {
  const actionPlan: ActionPlan = {
    problem,
    steps: [
      `Analyser la problématique : ${problem}`,
      'Définir les objectifs',
      'Mettre en œuvre les actions',
      'Suivre et ajuster',
    ],
  };

  const audit: AuditSuggestion = {
    problem,
    checklist: [
      `Vérifier la problématique : ${problem}`,
      'Identifier les causes',
      'Documenter les preuves',
    ],
  };

  return { actionPlan, audit };
}
