/**
 * Gouvernance & preuves d'exécution.
 *
 * Un audit clôturé (terminé ou annulé) est verrouillé : il devient une preuve
 * d'exécution immuable et ne doit plus être modifié. De même, une formation
 * validée est certifiée et figée.
 */
export function isAuditLocked(audit: { status: string }): boolean {
  return audit.status === 'completed' || audit.status === 'cancelled';
}

export function canEditAudit(audit: { status: string }): boolean {
  return !isAuditLocked(audit);
}

export function isTrainingCertified(
  progress: { status: string } | null | undefined,
): boolean {
  return progress?.status === 'completed';
}
