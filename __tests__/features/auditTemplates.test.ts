import { describe, it, expect } from 'vitest';

import {
  getDemoAuditTemplates,
  getDemoAuditTemplateItems,
} from '../../lib/demoData';

describe('bibliothèque de modèles d’audit démo', () => {
  const templates = getDemoAuditTemplates();
  const items = getDemoAuditTemplateItems();

  it('propose une bibliothèque large (≥ 19 modèles, ids uniques)', () => {
    expect(templates.length).toBeGreaterThanOrEqual(19);
    const ids = templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque modèle possède des critères et un type valide', () => {
    const validTypes = new Set(['yes_no', 'score_1_5', 'text', 'photo']);
    for (const template of templates) {
      const own = items.filter((i) => i.template_id === template.id);
      expect(own.length).toBeGreaterThanOrEqual(4);
      for (const it of own) {
        expect(validTypes.has(it.item_type)).toBe(true);
        expect(it.points).toBeGreaterThan(0);
      }
    }
  });

  it('conserve le modèle HACCP socle (contrat E2E)', () => {
    const haccp = templates.find((t) => t.id === 'demo-template-haccp');
    expect(haccp?.name).toBe('HACCP alimentaire');
    expect(
      items.some(
        (i) =>
          i.id === 'demo-haccp-item-1' &&
          i.question ===
            'La température des produits frais est-elle conforme ?',
      ),
    ).toBe(true);
  });
});
