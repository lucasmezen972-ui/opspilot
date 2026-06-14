import { describe, expect, it } from 'vitest';

import {
  calculateAuditScore,
  calculateSectionScores,
  getResponseCompliance,
  validateAuditResponses,
  type AuditResponseDraft,
} from '../../../features/audits/scoring';
import type { AuditTemplateItem } from '../../../lib/supabase';

const items: AuditTemplateItem[] = [
  {
    id: 'yes-no',
    template_id: 'template',
    section: 'Contrôle',
    question: 'Conforme ?',
    item_type: 'yes_no',
    is_required: true,
    points: 60,
    sort_order: 1,
  },
  {
    id: 'rating',
    template_id: 'template',
    section: 'Contrôle',
    question: 'Note',
    item_type: 'score_1_5',
    is_required: true,
    points: 40,
    sort_order: 2,
  },
];

const response = (
  itemId: string,
  value: AuditResponseDraft['value'],
  photoUrl?: string,
): AuditResponseDraft => ({
  item_id: itemId,
  value,
  photo_url: photoUrl,
  comment: null,
  is_compliant: getResponseCompliance(
    items.find((item) => item.id === itemId)!,
    value,
  ),
});

describe('audit scoring', () => {
  it('calcule un score pondéré', () => {
    expect(
      calculateAuditScore(items, [
        response('yes-no', true),
        response('rating', 3),
      ]),
    ).toBe(80);
  });

  it('considère une note inférieure à 3 comme non conforme', () => {
    expect(getResponseCompliance(items[1]!, 2)).toBe(false);
    expect(getResponseCompliance(items[1]!, 3)).toBe(true);
  });

  it('exige une photo pour chaque non-conformité', () => {
    const errors = validateAuditResponses(items, [
      response('yes-no', false),
      response('rating', 5),
    ]);
    expect(errors).toContainEqual({
      itemId: 'yes-no',
      message: 'Une photo est obligatoire pour une non-conformité.',
    });
  });

  it('accepte la non-conformité lorsqu’une photo est jointe', () => {
    expect(
      validateAuditResponses(items, [
        response('yes-no', false, 'file://preuve.jpg'),
        response('rating', 5),
      ]),
    ).toEqual([]);
  });

  it('calcule un score de conformité par section', () => {
    const multi = [
      ...items,
      {
        id: 'recep',
        template_id: 'template',
        section: 'Réception',
        question: 'Température OK ?',
        item_type: 'yes_no' as const,
        is_required: true,
        points: 20,
        sort_order: 3,
      },
    ];
    const sections = calculateSectionScores(multi, [
      response('yes-no', true),
      response('rating', 3),
      { item_id: 'recep', value: false, is_compliant: false },
    ]);
    const byName = Object.fromEntries(sections.map((s) => [s.section, s]));
    expect(byName['Contrôle']?.score).toBe(80);
    expect(byName['Réception']?.score).toBe(0);
    expect(byName['Réception']?.conformCount).toBe(0);
    expect(byName['Réception']?.evaluatedCount).toBe(1);
  });
});
