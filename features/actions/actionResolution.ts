import type { ActionPlan } from './actionPlan';

export interface ResolutionEvidencePayload {
  comment: string;
  employeeName: string;
  employeeId: string;
  photoConfirmed: boolean;
  managerValidated: boolean;
}

export function getMissingResolutionRequirements(
  plan: ActionPlan | null,
  evidence: ResolutionEvidencePayload,
): string[] {
  if (!plan) return [];
  return [
    plan.commentRequired && evidence.comment.trim().length === 0
      ? 'commentaire'
      : null,
    plan.employeeNameRequired && evidence.employeeName.trim().length === 0
      ? 'nom exécutant'
      : null,
    plan.employeeIdRequired && evidence.employeeId.trim().length === 0
      ? 'matricule'
      : null,
    plan.photoRequired && !evidence.photoConfirmed ? 'preuve photo' : null,
    plan.managerValidationRequired && !evidence.managerValidated
      ? 'validation manager'
      : null,
  ].filter((item): item is string => item !== null);
}

export function canResolveAction(
  plan: ActionPlan | null,
  evidence: ResolutionEvidencePayload,
): boolean {
  return getMissingResolutionRequirements(plan, evidence).length === 0;
}

export function buildResolutionActivityLabel({
  title,
  evidence,
}: {
  title: string;
  evidence: ResolutionEvidencePayload;
}): string {
  const proof = evidence.photoConfirmed
    ? 'preuve photo confirmée'
    : 'sans photo';
  const manager = evidence.managerValidated
    ? 'validation manager confirmée'
    : 'sans validation manager';
  return `Action corrective « ${title} » résolue — ${proof}, ${manager}.`;
}
