import type {
  AuditSection,
  AuditTemplate,
  AuditTemplateItem,
  AuditTemplateVersion,
} from '../../lib/supabase';

const DEMO_ORG = 'demo-org-00000000-0000-0000-0000-000000000001';

/**
 * Sections normalisées d'un modèle, dérivées de l'ordre d'apparition de ses
 * critères (le champ `section` des items reste la source).
 */
export function extractSections(
  templateId: string,
  items: AuditTemplateItem[],
): AuditSection[] {
  const seen: string[] = [];
  for (const item of [...items].sort((a, b) => a.sort_order - b.sort_order)) {
    if (item.template_id === templateId && !seen.includes(item.section)) {
      seen.push(item.section);
    }
  }
  return seen.map((name, index) => ({
    id: `${templateId}-section-${index + 1}`,
    organization_id: DEMO_ORG,
    template_id: templateId,
    name,
    sort_order: index + 1,
  }));
}

/** Version courante (la plus haute) d'un modèle, 1 par défaut. */
export function currentTemplateVersion(
  versions: AuditTemplateVersion[],
  templateId: string,
): number {
  const own = versions.filter((v) => v.template_id === templateId);
  if (own.length === 0) return 1;
  return Math.max(...own.map((v) => v.version));
}

/** Snapshot de version « v1 » initial pour chaque modèle. */
export function initialTemplateVersions(
  templates: AuditTemplate[],
  items: AuditTemplateItem[],
): AuditTemplateVersion[] {
  return templates.map((template) => ({
    id: `${template.id}-v1`,
    organization_id: template.organization_id,
    template_id: template.id,
    version: 1,
    name: template.name,
    item_count: items.filter((i) => i.template_id === template.id).length,
    created_at: template.created_at ?? new Date().toISOString(),
  }));
}
