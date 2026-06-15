import type { AuditSignature } from '../../lib/supabase';

export type SignableRole = AuditSignature['signer_role'];

export const SIGNER_ROLE_LABELS: Record<AuditSignature['signer_role'], string> =
  {
    auditor: 'Auditeur',
    manager: 'Responsable',
  };

/** Signatures d'un audit donné. */
export function signaturesForAudit(
  signatures: AuditSignature[],
  auditId: string,
): AuditSignature[] {
  return signatures.filter((s) => s.audit_id === auditId);
}

/** Au moins une signature présente. */
export function isAuditSigned(signatures: AuditSignature[]): boolean {
  return signatures.length > 0;
}

/** Un rôle a-t-il déjà signé cet audit ? */
export function hasRoleSigned(
  signatures: AuditSignature[],
  role: AuditSignature['signer_role'],
): boolean {
  return signatures.some((s) => s.signer_role === role);
}

/** Résumé court des signataires (« Auditeur : X · Responsable : Y »). */
export function signatureSummary(signatures: AuditSignature[]): string {
  return signatures
    .slice()
    .sort((a, b) => a.signer_role.localeCompare(b.signer_role))
    .map((s) => `${SIGNER_ROLE_LABELS[s.signer_role]} : ${s.signer_name}`)
    .join(' · ');
}
