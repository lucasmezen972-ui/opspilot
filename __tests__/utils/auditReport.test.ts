import { describe, it, expect } from 'vitest';

import type {
  Audit,
  AuditResponse,
  AuditTemplateItem,
  CorrectiveAction,
} from '../../lib/supabase';
import {
  conformityVerdict,
  buildAuditReportHTML,
  isEmbeddablePhoto,
} from '../../utils/auditReport';

const audit: Audit = {
  id: 'demo-audit-1234abcd',
  organization_id: 'org',
  auditor_id: 'u',
  title: 'Contrôle hygiène',
  location: 'Rayon frais',
  status: 'completed',
  score: 72,
  max_score: 100,
  issues_count: 1,
  photos: [],
  created_at: '2026-06-01T08:00:00Z',
  completed_at: '2026-06-01T09:00:00Z',
  updated_at: '2026-06-01T09:00:00Z',
};

describe('isEmbeddablePhoto', () => {
  it('n’accepte que les sources directement affichables', () => {
    expect(isEmbeddablePhoto('data:image/png;base64,AA')).toBe(true);
    expect(isEmbeddablePhoto('https://cdn/x.jpg')).toBe(true);
    expect(isEmbeddablePhoto('org/audit/1/p.jpg')).toBe(false);
    expect(isEmbeddablePhoto('file:///x.jpg')).toBe(false);
    expect(isEmbeddablePhoto('blob:http://x')).toBe(false);
    expect(isEmbeddablePhoto(null)).toBe(false);
  });
});

describe('conformityVerdict', () => {
  it('classe selon le score', () => {
    expect(conformityVerdict(90).label).toBe('Conforme');
    expect(conformityVerdict(70).label).toBe('À surveiller');
    expect(conformityVerdict(40).label).toBe('Non conforme');
    expect(conformityVerdict(null).label).toBe('Non évalué');
  });
});

describe('buildAuditReportHTML', () => {
  it('inclut le titre, le verdict et une référence', () => {
    const html = buildAuditReportHTML(audit);
    expect(html).toContain('Contrôle hygiène');
    expect(html).toContain('À surveiller');
    expect(html).toContain('AUD-2026-');
    expect(html).toContain("Rapport d'audit de conformité");
  });

  it('produit une synthèse exécutive avec le verdict', () => {
    const html = buildAuditReportHTML(audit);
    expect(html).toContain('Synthèse');
    expect(html).toContain('verdict de conformité');
    expect(html).toContain('plan de surveillance');
  });

  it('inclut un bloc de signature auditeur et responsable', () => {
    const html = buildAuditReportHTML(audit, {
      auditorName: 'Marie Dupont',
      responsibleName: 'Paul Durand',
    });
    expect(html).toContain('Validation');
    expect(html).toContain('Marie Dupont');
    expect(html).toContain('Paul Durand');
    expect(html).toContain('Responsable');
  });

  it('compte les critères conformes dans la synthèse', () => {
    const responses: AuditResponse[] = [
      { id: 'r1', audit_id: audit.id, item_id: 'i1', is_compliant: true },
      { id: 'r2', audit_id: audit.id, item_id: 'i2', is_compliant: false },
    ];
    const html = buildAuditReportHTML(audit, { responses });
    expect(html).toContain('2 critère(s) évalué(s)');
    expect(html).toContain('1 conforme(s)');
  });

  it('incruste la vraie preuve photo si elle est affichable (data:)', () => {
    const items: AuditTemplateItem[] = [
      {
        id: 'i1',
        template_id: 't',
        section: 'Réception',
        question: 'Température conforme ?',
        item_type: 'yes_no',
        is_required: true,
        points: 10,
        sort_order: 1,
      },
    ];
    const responses: AuditResponse[] = [
      {
        id: 'r1',
        audit_id: audit.id,
        item_id: 'i1',
        is_compliant: false,
        photo_url: 'data:image/png;base64,AAAA',
      },
    ];
    const html = buildAuditReportHTML(audit, { items, responses });
    expect(html).toContain('<img class="crit-photo-img"');
    expect(html).toContain('data:image/png;base64,AAAA');
    expect(html).toContain('Preuve photo enregistrée');
  });

  it('n’incruste pas de preuve non affichable (chemin de stockage privé)', () => {
    const items: AuditTemplateItem[] = [
      {
        id: 'i1',
        template_id: 't',
        section: 'Réception',
        question: 'Température conforme ?',
        item_type: 'yes_no',
        is_required: true,
        points: 10,
        sort_order: 1,
      },
    ];
    const responses: AuditResponse[] = [
      {
        id: 'r1',
        audit_id: audit.id,
        item_id: 'i1',
        is_compliant: false,
        photo_url: 'org-1/audit/demo-audit-1234abcd/123-preuve.jpg',
      },
    ];
    const html = buildAuditReportHTML(audit, { items, responses });
    // Référence honnête, sans image cassée ni fausse pièce jointe.
    expect(html).toContain('Preuve photo enregistrée');
    expect(html).not.toContain('<img');
    expect(html).not.toContain(
      'org-1/audit/demo-audit-1234abcd/123-preuve.jpg',
    );
  });

  it('échappe le contenu utilisateur (anti-injection)', () => {
    const html = buildAuditReportHTML({
      ...audit,
      title: '<script>alert(1)</script>',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('détaille les critères et le plan d’action quand fournis', () => {
    const items: AuditTemplateItem[] = [
      {
        id: 'i1',
        template_id: 't',
        section: 'Réception',
        question: 'Température conforme ?',
        item_type: 'yes_no',
        is_required: true,
        points: 10,
        sort_order: 1,
      },
    ];
    const responses: AuditResponse[] = [
      { id: 'r1', audit_id: audit.id, item_id: 'i1', is_compliant: false },
    ];
    const actions: CorrectiveAction[] = [
      {
        id: 'c1',
        organization_id: 'org',
        title: 'Recalibrer la chambre froide',
        priority: 'critical',
        status: 'open',
        audit_id: audit.id,
      },
    ];
    const html = buildAuditReportHTML(audit, { items, responses, actions });
    expect(html).toContain('Détail des critères');
    expect(html).toContain('Température conforme ?');
    expect(html).toContain('Non conforme');
    expect(html).toContain("Plan d'action correctif");
    expect(html).toContain('Recalibrer la chambre froide');
    // Analyse de conformité par section (audits avancés).
    expect(html).toMatch(/% conforme ·/);
  });
});
