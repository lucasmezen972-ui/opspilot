import type { AuditTemplateItem } from '../../lib/supabase';

export type AuditResponseDraft = {
  item_id: string;
  value: boolean | number | string | null;
  photo_url?: string | null;
  comment?: string | null;
  is_compliant: boolean | null;
};

export type AuditValidationError = {
  itemId: string;
  message: string;
};

function hasValue(item: AuditTemplateItem, response?: AuditResponseDraft) {
  if (!response) return false;
  if (item.item_type === 'photo') return Boolean(response.photo_url);
  if (typeof response.value === 'string') return response.value.trim() !== '';
  return response.value !== null && response.value !== undefined;
}

export function getResponseCompliance(
  item: AuditTemplateItem,
  value: AuditResponseDraft['value'],
): boolean {
  if (item.item_type === 'yes_no') return value === true;
  if (item.item_type === 'score_1_5') {
    return typeof value === 'number' && value >= 3;
  }
  return true;
}

export function validateAuditResponses(
  items: AuditTemplateItem[],
  responses: AuditResponseDraft[],
): AuditValidationError[] {
  const byItem = new Map(
    responses.map((response) => [response.item_id, response]),
  );
  const errors: AuditValidationError[] = [];

  for (const item of items) {
    const response = byItem.get(item.id);
    if (item.is_required && !hasValue(item, response)) {
      errors.push({
        itemId: item.id,
        message: 'Une réponse est obligatoire pour ce critère.',
      });
      continue;
    }

    if (
      response &&
      response.is_compliant === false &&
      !response.photo_url &&
      (item.item_type === 'yes_no' || item.item_type === 'score_1_5')
    ) {
      errors.push({
        itemId: item.id,
        message: 'Une photo est obligatoire pour une non-conformité.',
      });
    }
  }

  return errors;
}

/**
 * Points obtenus / disponibles pour un critère. Un critère facultatif non
 * renseigné ne compte pas (availability 0).
 */
function itemPoints(
  item: AuditTemplateItem,
  response?: AuditResponseDraft,
): { earned: number; available: number } {
  if (!item.is_required && !hasValue(item, response)) {
    return { earned: 0, available: 0 };
  }
  const available = item.points;
  if (!response) return { earned: 0, available };

  if (item.item_type === 'score_1_5') {
    const rating =
      typeof response.value === 'number'
        ? Math.min(5, Math.max(1, response.value))
        : 1;
    return { earned: item.points * ((rating - 1) / 4), available };
  }
  if (item.item_type === 'yes_no') {
    return { earned: response.value === true ? item.points : 0, available };
  }
  return { earned: hasValue(item, response) ? item.points : 0, available };
}

export function calculateAuditScore(
  items: AuditTemplateItem[],
  responses: AuditResponseDraft[],
): number {
  const byItem = new Map(
    responses.map((response) => [response.item_id, response]),
  );
  let earnedPoints = 0;
  let availablePoints = 0;

  for (const item of items) {
    const { earned, available } = itemPoints(item, byItem.get(item.id));
    earnedPoints += earned;
    availablePoints += available;
  }

  if (availablePoints === 0) return 0;
  return Math.round((earnedPoints / availablePoints) * 100);
}

export interface SectionScore {
  section: string;
  /** Score pondéré de la section (0–100). */
  score: number;
  /** Critères conformes / évalués dans la section. */
  conformCount: number;
  evaluatedCount: number;
}

/**
 * Score de conformité par section : met en évidence les zones faibles d'un
 * audit (analyse de conformité avancée).
 */
export function calculateSectionScores(
  items: AuditTemplateItem[],
  responses: AuditResponseDraft[],
): SectionScore[] {
  const byItem = new Map(
    responses.map((response) => [response.item_id, response]),
  );
  const groups = new Map<
    string,
    { earned: number; available: number; conform: number; evaluated: number }
  >();
  const order: string[] = [];

  for (const item of [...items].sort((a, b) => a.sort_order - b.sort_order)) {
    const response = byItem.get(item.id);
    const { earned, available } = itemPoints(item, response);
    if (available === 0) continue;

    const section = item.section || 'Critères';
    if (!groups.has(section)) {
      groups.set(section, {
        earned: 0,
        available: 0,
        conform: 0,
        evaluated: 0,
      });
      order.push(section);
    }
    const group = groups.get(section)!;
    group.earned += earned;
    group.available += available;
    group.evaluated += 1;
    if (response?.is_compliant) group.conform += 1;
  }

  return order.map((section) => {
    const group = groups.get(section)!;
    return {
      section,
      score:
        group.available > 0
          ? Math.round((group.earned / group.available) * 100)
          : 0,
      conformCount: group.conform,
      evaluatedCount: group.evaluated,
    };
  });
}
