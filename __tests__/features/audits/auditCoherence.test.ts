import { describe, it, expect } from 'vitest';

import { AUDIT_QUESTIONS } from '../../../features/audits/constants';
import {
  getDemoAudits,
  getDemoAuditTemplates,
  getDemoAuditTemplateItems,
} from '../../../lib/demoData';

/**
 * Garantit la cohérence métier des audits : un audit parking/extérieur ne doit
 * jamais afficher de questions rayon, DLC ou froid, et le questionnaire libre
 * (audits sans template) reste neutre, sans vocabulaire métier incohérent.
 */

// Vocabulaire interne au magasin (rayon, froid, dates) à proscrire d'un audit
// extérieur et d'un questionnaire générique neutre.
const FORBIDDEN_INDOOR =
  /rayon|dlc|ddm|frigo|congélat|allerg|chambre froide|hygiène alimentaire/i;

describe('cohérence métier des audits', () => {
  const templates = getDemoAuditTemplates();
  const items = getDemoAuditTemplateItems();
  const audits = getDemoAudits();

  const parkingItems = items.filter(
    (i) => i.template_id === 'demo-template-parking',
  );

  it('expose un référentiel « Parking / extérieur magasin » dédié', () => {
    const parking = templates.find((t) => t.id === 'demo-template-parking');
    expect(parking?.name).toBe('Parking / extérieur magasin');
    expect(parkingItems.length).toBeGreaterThanOrEqual(4);
  });

  it('l’audit parking ne contient aucune question rayon / DLC / froid', () => {
    expect(parkingItems.length).toBeGreaterThan(0);
    for (const item of parkingItems) {
      expect(
        FORBIDDEN_INDOOR.test(item.question),
        `Question parking incohérente : "${item.question}"`,
      ).toBe(false);
    }
  });

  it('couvre les critères extérieurs attendus (propreté, sécurité, accès)', () => {
    const corpus = parkingItems
      .map((i) => i.question.toLowerCase())
      .join(' | ');
    expect(corpus).toContain('parking');
    expect(corpus).toContain('chariots');
    expect(corpus).toContain('pmr');
    expect(corpus).toContain('secours');
    expect(corpus).toContain('éclairage');
    expect(corpus).toContain('signalétique');
  });

  it('rattache l’audit démo « Tournée propreté parking » au template parking', () => {
    const parkingAudit = audits.find((a) => a.id === 'demo-audit-6');
    expect(parkingAudit?.template_id).toBe('demo-template-parking');
  });

  it('chaque audit typé référence un template existant', () => {
    const templateIds = new Set(templates.map((t) => t.id));
    const typed = audits.filter((a) => a.template_id);
    expect(typed.length).toBeGreaterThan(0);
    for (const audit of typed) {
      expect(templateIds.has(audit.template_id as string)).toBe(true);
    }
    // Contrats explicites de la démo scénarisée.
    expect(audits.find((a) => a.id === 'demo-audit-7')?.template_id).toBe(
      'demo-template-haccp',
    );
    expect(audits.find((a) => a.id === 'demo-audit-5')?.template_id).toBe(
      'demo-template-securite',
    );
  });

  it('conserve au moins un audit libre (sans template) pour le questionnaire neutre', () => {
    const free = audits.filter((a) => !a.template_id);
    expect(free.length).toBeGreaterThan(0);
    expect(
      audits.find((a) => a.id === 'demo-audit-4')?.template_id,
    ).toBeFalsy();
  });

  it('le questionnaire libre est neutre, sans vocabulaire métier incohérent', () => {
    expect(AUDIT_QUESTIONS.length).toBeGreaterThanOrEqual(4);
    for (const question of AUDIT_QUESTIONS) {
      expect(
        FORBIDDEN_INDOOR.test(question),
        `Question libre incohérente : "${question}"`,
      ).toBe(false);
    }
  });
});
