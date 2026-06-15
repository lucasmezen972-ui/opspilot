import { describe, expect, it } from 'vitest';

import {
  buildCertificateHTML,
  generateCertificateNumber,
  type CertificateContext,
} from '../../../features/training/certificate';

const base: CertificateContext = {
  fullName: 'Jean Martin',
  trainingTitle: 'Hygiène alimentaire HACCP',
  category: 'Sécurité alimentaire',
  score: 92,
  issuedAt: '2026-06-01T09:00:00.000Z',
  certificateNumber: 'OPS-2026-01234',
  employeeId: 'M-1042',
  position: 'Employé polyvalent',
  store: 'Magasin Lyon Part-Dieu',
  durationMinutes: 45,
  version: 'Q-AB12C',
  attemptNumber: 1,
};

describe('generateCertificateNumber', () => {
  it('est déterministe et formaté OPS-AAAA-XXXXX', () => {
    const a = generateCertificateNumber('user-1', 'training-1');
    const b = generateCertificateNumber('user-1', 'training-1');
    expect(a).toBe(b);
    expect(a).toMatch(/^OPS-\d{4}-\d{5}$/);
  });
});

describe('buildCertificateHTML', () => {
  it('intègre identité, matricule, poste et magasin', () => {
    const html = buildCertificateHTML(base);
    expect(html).toContain('Jean Martin');
    expect(html).toContain('M-1042');
    expect(html).toContain('Employé polyvalent');
    expect(html).toContain('Magasin Lyon Part-Dieu');
    expect(html).toContain('Hygiène alimentaire HACCP');
  });

  it('détaille évaluation : durée, version et tentative', () => {
    const html = buildCertificateHTML(base);
    expect(html).toContain('45 min');
    expect(html).toContain('Q-AB12C');
    expect(html).toContain('N° 1');
    expect(html).toContain('92 %');
  });

  it('affiche un statut validé par défaut', () => {
    const html = buildCertificateHTML(base);
    expect(html).toContain('Formation validée');
  });

  it('affiche un statut échoué quand le statut est échoué', () => {
    const html = buildCertificateHTML({ ...base, status: 'échoué', score: 40 });
    expect(html).toContain('Formation non validée');
    expect(html).toContain('40 %');
  });

  it('remplace les champs manquants par un tiret', () => {
    const html = buildCertificateHTML({
      fullName: 'Sophie Bernard',
      trainingTitle: 'Sécurité incendie',
      score: 80,
      issuedAt: '2026-06-01T09:00:00.000Z',
      certificateNumber: 'OPS-2026-00001',
    });
    expect(html).toContain('Sophie Bernard');
    expect(html).toContain('—');
  });
});
