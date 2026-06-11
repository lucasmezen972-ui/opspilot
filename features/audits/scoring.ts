import type { AuditTemplateItem } from '../../lib/supabase';

export type AuditResponseDraft = {
  item_id: string;
  value: boolean | number | string | null;
  photo_url?: string | null;
  comment?: string | null;
  is_compliant: boolean;
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
      !response.is_compliant &&
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
    const response = byItem.get(item.id);
    if (!item.is_required && !hasValue(item, response)) continue;

    availablePoints += item.points;
    if (!response) continue;

    if (item.item_type === 'score_1_5') {
      const rating =
        typeof response.value === 'number'
          ? Math.min(5, Math.max(1, response.value))
          : 1;
      earnedPoints += item.points * ((rating - 1) / 4);
    } else if (item.item_type === 'yes_no') {
      if (response.value === true) earnedPoints += item.points;
    } else if (hasValue(item, response)) {
      earnedPoints += item.points;
    }
  }

  if (availablePoints === 0) return 0;
  return Math.round((earnedPoints / availablePoints) * 100);
}
