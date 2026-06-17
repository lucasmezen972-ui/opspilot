import type { Audit } from '../../lib/supabase';

/** Ligne de conformité par site (regroupement par localisation d'audit). */
export interface SiteConformityRow {
  site: string;
  audits: number;
  completed: number;
  conformity: number | null;
  nonConformities: number;
}

function avgScore(audits: Audit[]): number | null {
  const scored = audits.filter((a) => a.score != null);
  if (scored.length === 0) return null;
  return Math.round(
    scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length,
  );
}

/** Conformité multi-sites : une ligne par localisation, triée par nom. */
export function buildSiteConformity(audits: Audit[]): SiteConformityRow[] {
  const groups = new Map<string, Audit[]>();
  for (const audit of audits) {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string should fall through to default
    const site = audit.location?.trim() || 'Site principal';
    const bucket = groups.get(site);
    if (bucket) bucket.push(audit);
    else groups.set(site, [audit]);
  }

  return [...groups.entries()]
    .map(([site, list]) => {
      const completed = list.filter((a) => a.status === 'completed');
      return {
        site,
        audits: list.length,
        completed: completed.length,
        conformity: avgScore(completed),
        nonConformities: list.reduce(
          (sum, a) => sum + (a.issues_count ?? 0),
          0,
        ),
      };
    })
    .sort((a, b) => a.site.localeCompare(b.site, 'fr'));
}

export interface ReportEvolution {
  completed30d: number;
  completed90d: number;
  conformity30d: number | null;
}

/** Évolution sur 30 / 90 jours (audits clôturés et conformité récente). */
export function buildEvolution(
  audits: Audit[],
  now: number = Date.now(),
): ReportEvolution {
  const completedWithin = (days: number) =>
    audits.filter((a) => {
      if (a.status !== 'completed' || !a.completed_at) return false;
      return new Date(a.completed_at).getTime() >= now - days * 86_400_000;
    });

  const c30 = completedWithin(30);
  return {
    completed30d: c30.length,
    completed90d: completedWithin(90).length,
    conformity30d: avgScore(c30),
  };
}

/** Aplatit le rapport multi-sites pour l'export CSV / Excel. */
export function directionReportRows(
  sites: SiteConformityRow[],
): Record<string, string | number>[] {
  return sites.map((s) => ({
    Site: s.site,
    Audits: s.audits,
    Terminés: s.completed,
    'Conformité (%)': s.conformity ?? '—',
    'Non-conformités': s.nonConformities,
  }));
}
