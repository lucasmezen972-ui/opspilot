import { describe, it, expect } from 'vitest';

import {
  EVIDENCE_BUCKET,
  buildEvidenceStoragePath,
  organizationFromEvidencePath,
  sanitizeFileName,
} from '../../../features/evidence/evidenceStorage';

describe('sanitizeFileName', () => {
  it('normalise les noms en segments sûrs sans casser l’extension', () => {
    expect(sanitizeFileName('Preuve Photo (1).JPG')).toBe('preuve-photo-1.jpg');
    expect(sanitizeFileName('  rapport final.PNG ')).toBe('rapport-final.png');
    expect(sanitizeFileName('photo')).toBe('photo');
  });

  it('retombe sur un nom par défaut si vide', () => {
    expect(sanitizeFileName('')).toBe('fichier');
    expect(sanitizeFileName('***')).toBe('fichier');
  });
});

describe('buildEvidenceStoragePath', () => {
  it('place toujours l’organisation en premier segment (cloisonnement RLS)', () => {
    const path = buildEvidenceStoragePath({
      organizationId: 'org-123',
      entityType: 'corrective_action',
      entityId: 'act-9',
      fileName: 'Constat.JPG',
      now: 1_700_000_000_000,
    });
    expect(path).toBe(
      'org-123/corrective_action/act-9/1700000000000-constat.jpg',
    );
    expect(organizationFromEvidencePath(path)).toBe('org-123');
  });

  it('exige une organisation et une entité', () => {
    expect(() =>
      buildEvidenceStoragePath({
        organizationId: '',
        entityType: 'audit',
        entityId: 'a1',
        fileName: 'x.jpg',
      }),
    ).toThrow();
    expect(() =>
      buildEvidenceStoragePath({
        organizationId: 'org',
        entityType: 'audit',
        entityId: '',
        fileName: 'x.jpg',
      }),
    ).toThrow();
  });

  it('expose le nom du bucket privé', () => {
    expect(EVIDENCE_BUCKET).toBe('evidence');
  });
});

describe('organizationFromEvidencePath', () => {
  it('retourne null pour un chemin vide', () => {
    expect(organizationFromEvidencePath('')).toBeNull();
  });
});
