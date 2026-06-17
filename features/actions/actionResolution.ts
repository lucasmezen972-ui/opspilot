import type { ActionPlan } from './actionPlan';
import type { CorrectiveAction } from '../../lib/supabase';
import { can } from '../../utils/permissions';

export interface ResolutionEvidencePayload {
  comment: string;
  employeeName: string;
  employeeId: string;
  /** URI réelle de la preuve photo (capture / import), ou null si absente. */
  proofPhotoUri: string | null;
  managerValidated: boolean;
}

/** Profil minimal de la personne qui clôture (auteur de résolution). */
export interface ResolutionResolver {
  id?: string | null;
  role?: string | null;
}

/**
 * Colonnes persistées sur corrective_actions lors d'une clôture contrôlée.
 * Sérialisable tel quel pour Supabase comme pour le store démo local.
 */
export type ResolutionRecord = Pick<
  CorrectiveAction,
  | 'resolution_comment'
  | 'resolved_by_name'
  | 'resolved_by_matricule'
  | 'resolution_photo_confirmed'
  | 'resolution_photo_url'
  | 'manager_validated'
  | 'resolved_by'
  | 'resolver_role'
>;

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
    plan.photoRequired && !evidence.proofPhotoUri ? 'preuve photo' : null,
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

/**
 * Construit l'enregistrement persistable des preuves de clôture, à écrire sur
 * corrective_actions (Supabase) ou dans le store démo. Les champs vides sont
 * normalisés à null pour rester cohérents en base.
 */
export function buildResolutionRecord(
  evidence: ResolutionEvidencePayload,
  resolver?: ResolutionResolver | null,
): ResolutionRecord {
  const photoUri = evidence.proofPhotoUri?.trim() || null;
  return {
    resolution_comment: evidence.comment.trim() || null,
    resolved_by_name: evidence.employeeName.trim() || null,
    resolved_by_matricule: evidence.employeeId.trim() || null,
    // « confirmé » découle d'une VRAIE preuve présente, jamais d'une simple case.
    resolution_photo_confirmed: photoUri !== null,
    resolution_photo_url: photoUri,
    manager_validated: evidence.managerValidated,
    resolved_by: resolver?.id ?? null,
    resolver_role: resolver?.role ?? null,
  };
}

/**
 * Garde-fou métier (au-delà de l'UI) : une action exigeant une validation
 * manager ne peut pas être clôturée « seule » par un profil sans la permission
 * `action.validate` (un employé). Un manager / admin peut valider lui-même.
 * Vérifie aussi que toutes les preuves obligatoires sont présentes.
 */
export function isResolutionAuthorized(
  plan: ActionPlan | null,
  evidence: ResolutionEvidencePayload,
  role: string | null | undefined,
): boolean {
  if (!canResolveAction(plan, evidence)) return false;
  if (plan?.managerValidationRequired && !can(role, 'action.validate')) {
    return false;
  }
  return true;
}

export function buildResolutionActivityLabel({
  title,
  evidence,
}: {
  title: string;
  evidence: ResolutionEvidencePayload;
}): string {
  const proof = evidence.proofPhotoUri
    ? 'preuve photo confirmée'
    : 'sans photo';
  const manager = evidence.managerValidated
    ? 'validation manager confirmée'
    : 'sans validation manager';
  return `Action corrective « ${title} » résolue — ${proof}, ${manager}.`;
}
