/**
 * Chemins de stockage des preuves (photos d'audit / d'action corrective).
 *
 * Règle de sécurité : le chemin commence TOUJOURS par l'identifiant de
 * l'organisation. La policy RLS du bucket s'appuie sur ce premier segment
 * (`storage.foldername(name)[1] = organization_id`) pour cloisonner les fichiers
 * par organisation — aucune fuite inter-organisations possible.
 *
 * Fonctions pures et testables : aucune dépendance réseau.
 */

export const EVIDENCE_BUCKET = 'evidence';

export type EvidenceEntityType = 'audit' | 'corrective_action' | 'task';

/** Normalise un nom de fichier en segment d'URL sûr (sans casser l'extension). */
export function sanitizeFileName(name: string): string {
  const trimmed = (name ?? '').trim().toLowerCase();
  const dot = trimmed.lastIndexOf('.');
  const rawBase = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  const rawExt = dot > 0 ? trimmed.slice(dot + 1) : '';
  const base =
    rawBase.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'fichier';
  const ext = rawExt.replace(/[^a-z0-9]+/g, '');
  return ext ? `${base}.${ext}` : base;
}

export interface EvidencePathInput {
  organizationId: string;
  entityType: EvidenceEntityType;
  entityId: string;
  fileName: string;
  now?: number;
}

/**
 * Construit un chemin de stockage cloisonné par organisation :
 * `<organizationId>/<entityType>/<entityId>/<timestamp>-<fichier>`.
 */
export function buildEvidenceStoragePath(input: EvidencePathInput): string {
  const { organizationId, entityType, entityId, fileName } = input;
  if (!organizationId?.trim()) {
    throw new Error('organizationId requis pour cloisonner la preuve');
  }
  if (!entityId?.trim()) {
    throw new Error('entityId requis pour rattacher la preuve');
  }
  const ts = input.now ?? Date.now();
  const safe = sanitizeFileName(fileName);
  return `${organizationId}/${entityType}/${entityId}/${ts}-${safe}`;
}

/** Premier segment du chemin = organisation propriétaire (ou null). */
export function organizationFromEvidencePath(path: string): string | null {
  const segment = path.split('/')[0];
  return segment && segment.length > 0 ? segment : null;
}
