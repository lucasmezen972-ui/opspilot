import { describe, it, expect } from 'vitest';

import {
  hasRoleSigned,
  isAuditSigned,
  signatureSummary,
  signaturesForAudit,
} from '../../features/audits/auditSignatureModel';
import type { AuditSignature } from '../../lib/supabase';

const sig = (over: Partial<AuditSignature>): AuditSignature => ({
  id: Math.random().toString(36).slice(2),
  organization_id: 'o',
  audit_id: 'a1',
  signer_name: 'X',
  signer_role: 'auditor',
  signed_at: '2026-06-15T10:00:00Z',
  ...over,
});

describe('auditSignatureModel', () => {
  const signatures = [
    sig({ audit_id: 'a1', signer_role: 'auditor', signer_name: 'Marie' }),
    sig({ audit_id: 'a1', signer_role: 'manager', signer_name: 'Jean' }),
    sig({ audit_id: 'a2', signer_role: 'auditor', signer_name: 'Emma' }),
  ];

  it('filtre les signatures par audit', () => {
    expect(signaturesForAudit(signatures, 'a1')).toHaveLength(2);
    expect(signaturesForAudit(signatures, 'a2')).toHaveLength(1);
    expect(signaturesForAudit(signatures, 'a3')).toHaveLength(0);
  });

  it('détecte la présence de signatures et de rôles', () => {
    const a1 = signaturesForAudit(signatures, 'a1');
    expect(isAuditSigned(a1)).toBe(true);
    expect(isAuditSigned([])).toBe(false);
    expect(hasRoleSigned(a1, 'manager')).toBe(true);
    const a2 = signaturesForAudit(signatures, 'a2');
    expect(hasRoleSigned(a2, 'manager')).toBe(false);
  });

  it('résume les signataires triés par rôle', () => {
    const summary = signatureSummary(signaturesForAudit(signatures, 'a1'));
    expect(summary).toBe('Auditeur : Marie · Responsable : Jean');
  });
});
