import { describe, it, expect } from 'vitest';

import {
  canEditAudit,
  isAuditLocked,
  isTrainingCertified,
} from '../../../features/governance/governanceModel';

describe('governanceModel', () => {
  it('verrouille un audit terminé ou annulé', () => {
    expect(isAuditLocked({ status: 'completed' })).toBe(true);
    expect(isAuditLocked({ status: 'cancelled' })).toBe(true);
    expect(isAuditLocked({ status: 'in_progress' })).toBe(false);
    expect(isAuditLocked({ status: 'pending' })).toBe(false);
  });

  it("canEditAudit est l'inverse du verrou", () => {
    expect(canEditAudit({ status: 'in_progress' })).toBe(true);
    expect(canEditAudit({ status: 'completed' })).toBe(false);
  });

  it('considère une formation terminée comme certifiée', () => {
    expect(isTrainingCertified({ status: 'completed' })).toBe(true);
    expect(isTrainingCertified({ status: 'in_progress' })).toBe(false);
    expect(isTrainingCertified(null)).toBe(false);
    expect(isTrainingCertified(undefined)).toBe(false);
  });
});
