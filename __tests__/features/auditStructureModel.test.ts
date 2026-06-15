import { describe, it, expect } from 'vitest';

import {
  currentTemplateVersion,
  extractSections,
  initialTemplateVersions,
} from '../../features/audits/auditStructureModel';
import {
  getDemoAuditTemplateItems,
  getDemoAuditTemplates,
} from '../../lib/demoData';
import type {
  AuditTemplateItem,
  AuditTemplateVersion,
} from '../../lib/supabase';

const item = (
  templateId: string,
  section: string,
  sortOrder: number,
): AuditTemplateItem => ({
  id: `${templateId}-${sortOrder}`,
  template_id: templateId,
  section,
  question: 'Q',
  item_type: 'yes_no',
  is_required: true,
  points: 10,
  sort_order: sortOrder,
});

describe('extractSections', () => {
  it('déduit les sections uniques dans l’ordre des critères', () => {
    const items = [
      item('t1', 'Réception', 2),
      item('t1', 'Réception', 1),
      item('t1', 'Stockage', 3),
      item('t2', 'Autre', 1),
    ];
    const sections = extractSections('t1', items);
    expect(sections.map((s) => s.name)).toEqual(['Réception', 'Stockage']);
    expect(sections[0]?.sort_order).toBe(1);
  });
});

describe('versions de modèle', () => {
  it('currentTemplateVersion renvoie la plus haute, 1 par défaut', () => {
    const versions: AuditTemplateVersion[] = [
      {
        id: 'a',
        organization_id: 'o',
        template_id: 't1',
        version: 1,
        name: 'T1',
        item_count: 5,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'b',
        organization_id: 'o',
        template_id: 't1',
        version: 3,
        name: 'T1',
        item_count: 6,
        created_at: '2026-02-01T00:00:00Z',
      },
    ];
    expect(currentTemplateVersion(versions, 't1')).toBe(3);
    expect(currentTemplateVersion(versions, 'inconnu')).toBe(1);
  });

  it('initialTemplateVersions crée une v1 par modèle avec le bon décompte', () => {
    const templates = getDemoAuditTemplates();
    const items = getDemoAuditTemplateItems();
    const versions = initialTemplateVersions(templates, items);
    expect(versions).toHaveLength(templates.length);
    const haccp = versions.find((v) => v.template_id === 'demo-template-haccp');
    expect(haccp?.version).toBe(1);
    expect(haccp?.item_count).toBeGreaterThan(0);
    // Sections dérivées cohérentes pour le même modèle.
    const sections = extractSections('demo-template-haccp', items);
    expect(sections.length).toBeGreaterThan(0);
  });
});
