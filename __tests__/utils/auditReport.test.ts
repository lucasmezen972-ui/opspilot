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
