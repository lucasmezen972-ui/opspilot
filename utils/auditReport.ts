import { Platform, Share } from 'react-native';

import {
  calculateSectionScores,
  type AuditResponseDraft,
} from '../features/audits/scoring';
import type {
  Audit,
  AuditResponse,
  AuditTemplateItem,
  CorrectiveAction,
} from '../lib/supabase';

/** Données complémentaires pour un rapport d'audit détaillé et professionnel. */
export interface AuditReportContext {
  /** Réponses par critère (jointes aux items du modèle). */
  responses?: AuditResponse[];
  /** Critères du modèle d'audit. */
  items?: AuditTemplateItem[];
  /** Actions correctives liées à l'audit. */
  actions?: CorrectiveAction[];
  organizationName?: string;
  auditorName?: string;
  /** Responsable validant le rapport (bloc de signature). */
  responsibleName?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'À faire',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const ACTION_PRIORITY_LABEL: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

const ACTION_STATUS_LABEL: Record<string, string> = {
  open: 'À traiter',
  in_progress: 'En cours',
  done: 'Résolue',
  cancelled: 'Annulée',
};

function scoreColor(score: number | null | undefined): string {
  if (score == null) return '#6B7280';
  if (score >= 80) return '#16A34A';
  if (score >= 60) return '#D97706';
  return '#DC2626';
}

/** Verdict de conformité lisible à partir du score. */
export function conformityVerdict(score: number | null | undefined): {
  label: string;
  color: string;
} {
  if (score == null) return { label: 'Non évalué', color: '#6B7280' };
  if (score >= 80) return { label: 'Conforme', color: '#16A34A' };
  if (score >= 60) return { label: 'À surveiller', color: '#D97706' };
  return { label: 'Non conforme', color: '#DC2626' };
}

/** Échappe le contenu utilisateur injecté dans le HTML du rapport. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function frDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}

/**
 * Une preuve photo n'est incrustable dans le rapport que si elle est
 * directement affichable (data: ou http/https). Les chemins de stockage privé
 * (« evidence ») ne le sont pas et ne doivent pas produire d'image cassée.
 */
export function isEmbeddablePhoto(url: unknown): url is string {
  return typeof url === 'string' && /^(data:|https?:)/i.test(url.trim());
}

/** Numéro de référence court et stable dérivé de l'identifiant d'audit. */
function reference(audit: Audit): string {
  const short = audit.id
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 8)
    .toUpperCase();
  const year = new Date(audit.created_at).getFullYear();
  return `AUD-${year}-${short}`;
}

/** Synthèse exécutive : narratif d'ouverture du rapport. */
function synthesisSection(audit: Audit, ctx: AuditReportContext): string {
  const verdict = conformityVerdict(audit.score);
  const responses = ctx.responses ?? [];
  const evaluated = responses.filter((r) => r.is_compliant != null);
  const conform = evaluated.filter((r) => r.is_compliant === true).length;
  const nonConform = evaluated.length - conform;

  const coverage = evaluated.length
    ? `${evaluated.length} critère(s) évalué(s), dont ${conform} conforme(s) et ${nonConform} non conforme(s).`
    : `${audit.issues_count} non-conformité(s) relevée(s) au cours du contrôle.`;

  const guidance =
    audit.score == null
      ? "L'audit n'a pas encore été noté."
      : audit.score >= 80
        ? 'Le niveau de conformité est satisfaisant ; maintenir les bonnes pratiques en place.'
        : audit.score >= 60
          ? 'Des écarts ont été constatés : un plan de surveillance et des actions correctives sont recommandés.'
          : 'Le niveau de conformité est insuffisant : un plan d’action correctif immédiat est requis.';

  return `
<div class="section">
  <h2>Synthèse</h2>
  <p style="font-size:14px;color:#374151">
    À l'issue du contrôle « ${esc(audit.title)} »${audit.location ? ` réalisé sur ${esc(audit.location)}` : ''},
    le verdict de conformité est <strong style="color:${verdict.color}">${verdict.label}</strong>
    pour un score global de <strong>${audit.score != null ? `${audit.score}%` : 'non noté'}</strong>.
    ${esc(coverage)} ${guidance}
  </p>
</div>`;
}

/** Bloc de signature : auditeur et responsable validant le rapport. */
function signatureSection(ctx: AuditReportContext): string {
  const auditorName = ctx.auditorName?.trim();
  const responsibleName = ctx.responsibleName?.trim();
  const auditor =
    auditorName && auditorName.length > 0 ? auditorName : 'Auditeur';
  const responsible =
    responsibleName && responsibleName.length > 0
      ? responsibleName
      : 'Responsable qualité';
  return `
<div class="section">
  <h2>Validation</h2>
  <div class="sigrow">
    <div class="sigblock">
      <div class="sigline"></div>
      <div class="siglabel">Auditeur</div>
      <div class="signame">${esc(auditor)}</div>
    </div>
    <div class="sigblock">
      <div class="sigline"></div>
      <div class="siglabel">Responsable</div>
      <div class="signame">${esc(responsible)}</div>
    </div>
  </div>
</div>`;
}

/** Tableau détaillé des critères, groupés par section, si les données existent. */
function criteriaSection(ctx: AuditReportContext): string {
  const items = ctx.items ?? [];
  const responses = ctx.responses ?? [];
  if (items.length === 0) return '';

  const byItem = new Map(responses.map((r) => [r.item_id, r]));
  const sections = new Map<string, AuditTemplateItem[]>();
  for (const item of [...items].sort((a, b) => a.sort_order - b.sort_order)) {
    const key = item.section || 'Critères';
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(item);
  }

  // Analyse de conformité par section (pondérée) : met en avant les zones
  // faibles. Affichée uniquement si l'audit comporte des réponses.
  const drafts: AuditResponseDraft[] = responses.map((r) => ({
    item_id: r.item_id,
    value: r.value ?? null,
    photo_url: r.photo_url ?? null,
    comment: r.comment ?? null,
    is_compliant: r.is_compliant ?? false,
  }));
  const sectionScoreByName = new Map(
    calculateSectionScores(items, drafts).map((s) => [s.section, s]),
  );

  const blocks = [...sections.entries()]
    .map(([section, sectionItems]) => {
      const sectionScore = responses.length
        ? sectionScoreByName.get(section)
        : undefined;
      const sectionBadge = sectionScore
        ? `<span class="crit-score" style="color:${scoreColor(sectionScore.score)}">${sectionScore.score}% conforme · ${sectionScore.conformCount}/${sectionScore.evaluatedCount}</span>`
        : '';
      const rows = sectionItems
        .map((item) => {
          const response = byItem.get(item.id);
          const compliant = response?.is_compliant;
          const badge =
            compliant === true
              ? '<span class="tag tag-ok">Conforme</span>'
              : compliant === false
                ? '<span class="tag tag-ko">Non conforme</span>'
                : '<span class="tag tag-na">Non évalué</span>';
          const comment = response?.comment
            ? `<div class="crit-comment">${esc(response.comment)}</div>`
            : '';
          // Honnêteté : on incruste la vraie photo si elle est directement
          // affichable (capture démo en data:/http) ; sinon on indique qu'une
          // preuve est enregistrée (chemin de stockage privé non incrustable),
          // sans laisser croire qu'elle est jointe au PDF.
          const photoTag = response?.photo_url
            ? '<span class="crit-photo">Preuve photo enregistrée</span>'
            : '';
          const photoImg = isEmbeddablePhoto(response?.photo_url)
            ? `<img class="crit-photo-img" src="${esc(response!.photo_url as string)}" alt="Preuve photo" />`
            : '';
          return `
        <tr>
          <td>
            <div class="crit-q">${esc(item.question)}</div>
            ${comment}
            ${photoImg}
          </td>
          <td class="crit-pts">${item.points} pts</td>
          <td class="crit-state">${badge} ${photoTag}</td>
        </tr>`;
        })
        .join('');
      return `
      <h3 class="crit-section">${esc(section)} ${sectionBadge}</h3>
      <table class="crit-table">
        <thead><tr><th>Critère</th><th>Points</th><th>Résultat</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    })
    .join('');

  return `
<div class="section">
  <h2>Détail des critères</h2>
  ${blocks}
</div>`;
}

/** Plan d'action correctif (actions liées à l'audit), si fourni. */
function actionsSection(ctx: AuditReportContext): string {
  const actions = ctx.actions ?? [];
  if (actions.length === 0) return '';

  const rows = actions
    .map(
      (action) => `
      <tr>
        <td>
          <div class="crit-q">${esc(action.title)}</div>
          ${action.description ? `<div class="crit-comment">${esc(action.description)}</div>` : ''}
        </td>
        <td>${esc(ACTION_PRIORITY_LABEL[action.priority] ?? action.priority)}</td>
        <td>${esc(ACTION_STATUS_LABEL[action.status] ?? action.status)}</td>
        <td>${frDate(action.due_date)}</td>
      </tr>`,
    )
    .join('');

  return `
<div class="section">
  <h2>Plan d'action correctif (${actions.length})</h2>
  <table class="crit-table">
    <thead><tr><th>Action</th><th>Priorité</th><th>Statut</th><th>Échéance</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

export function buildAuditReportHTML(
  audit: Audit,
  ctx: AuditReportContext = {},
): string {
  const date = audit.completed_at
    ? new Date(audit.completed_at).toLocaleDateString('fr-FR', {
        dateStyle: 'long',
      })
    : new Date(audit.created_at).toLocaleDateString('fr-FR', {
        dateStyle: 'long',
      });

  const score = audit.score != null ? `${audit.score}%` : 'Non noté';
  const color = scoreColor(audit.score);
  const verdict = conformityVerdict(audit.score);
  const ring = audit.score ?? 0;
  const org = ctx.organizationName ?? 'Organisation';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Rapport d'audit — ${esc(audit.title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; background: #F8FAFC; color: #111827; padding: 32px; line-height: 1.45; }
  .sheet { max-width: 820px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #fff; border-radius: 18px; padding: 30px 34px; margin-bottom: 22px; }
  .brandrow { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .brand { font-size: 20px; font-weight: 800; letter-spacing: -.5px; }
  .ref { font-size: 12px; opacity: .85; font-weight: 600; background: rgba(255,255,255,.15); padding: 5px 12px; border-radius: 999px; }
  .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 1.5px; opacity: .85; text-transform: uppercase; margin-bottom: 6px; }
  .header h1 { font-size: 24px; font-weight: 800; letter-spacing: -.4px; margin-bottom: 8px; }
  .meta { font-size: 13.5px; opacity: .92; }
  .summary { display: flex; gap: 20px; align-items: center; background: #fff; border: 1px solid #ECEFF3; border-radius: 16px; padding: 22px 26px; margin-bottom: 22px; box-shadow: 0 4px 12px rgba(15,23,42,.05); }
  .ring { width: 104px; height: 104px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center;
          background: conic-gradient(${color} ${ring * 3.6}deg, #EEF1F5 0deg); }
  .ring-inner { width: 78px; height: 78px; border-radius: 50%; background: #fff; display: grid; place-items: center; font-size: 22px; font-weight: 800; color: ${color}; }
  .verdict-label { font-size: 13px; color: #6B7280; margin-bottom: 4px; }
  .verdict { font-size: 22px; font-weight: 800; color: ${verdict.color}; letter-spacing: -.3px; }
  .verdict-sub { font-size: 13px; color: #6B7280; margin-top: 6px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-bottom: 22px; }
  .card { background: #fff; border: 1px solid #ECEFF3; border-radius: 12px; padding: 16px 18px; box-shadow: 0 4px 12px rgba(15,23,42,.05); }
  .card-label { font-size: 11.5px; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .5px; }
  .card-value { font-size: 24px; font-weight: 800; letter-spacing: -.3px; }
  .section { background: #fff; border: 1px solid #ECEFF3; border-radius: 14px; padding: 24px 26px; box-shadow: 0 4px 12px rgba(15,23,42,.05); margin-bottom: 20px; }
  .section h2 { font-size: 16px; font-weight: 700; margin-bottom: 16px; border-bottom: 2px solid #2563EB; padding-bottom: 10px; display: inline-block; }
  .row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .row span:first-child { color: #6B7280; }
  .crit-section { font-size: 13px; font-weight: 700; color: #1D4ED8; text-transform: uppercase; letter-spacing: .5px; margin: 18px 0 8px; }
  .crit-score { font-size: 11.5px; font-weight: 700; letter-spacing: 0; text-transform: none; margin-left: 6px; }
  .crit-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .crit-table th { text-align: left; font-size: 11.5px; text-transform: uppercase; letter-spacing: .5px; color: #9CA3AF; padding: 6px 10px; border-bottom: 1px solid #E5E7EB; }
  .crit-table td { padding: 11px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
  .crit-q { font-weight: 600; }
  .crit-comment { font-size: 12.5px; color: #6B7280; margin-top: 4px; }
  .crit-pts { white-space: nowrap; color: #6B7280; }
  .crit-state { white-space: nowrap; }
  .crit-photo { font-size: 11.5px; color: #6B7280; margin-left: 6px; }
  .crit-photo-img { display:block; max-width: 160px; max-height: 160px; margin-top: 8px; border-radius: 6px; border: 1px solid #E5E7EB; }
  .tag { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; }
  .tag-ok { background: #DCFCE7; color: #16A34A; }
  .tag-ko { background: #FEE2E2; color: #DC2626; }
  .tag-na { background: #F3F4F6; color: #6B7280; }
  .sigrow { display: flex; gap: 40px; flex-wrap: wrap; margin-top: 18px; }
  .sigblock { flex: 1; min-width: 180px; text-align: center; }
  .sigline { height: 2px; background: #D1D5DB; margin-bottom: 8px; }
  .siglabel { font-size: 11.5px; color: #6B7280; text-transform: uppercase; letter-spacing: .5px; }
  .signame { font-size: 14px; font-weight: 700; color: #111827; margin-top: 2px; }
  .footer { text-align: center; font-size: 11.5px; color: #9CA3AF; margin-top: 28px; line-height: 1.7; }
  .footer strong { color: #6B7280; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { max-width: none; }
    .no-print { display: none; }
    .section, .summary, .card { box-shadow: none; break-inside: avoid; }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="sheet">
<div class="header">
  <div class="brandrow">
    <div class="brand">OpsPilot</div>
    <div class="ref">${reference(audit)}</div>
  </div>
  <div class="eyebrow">Rapport d'audit de conformité</div>
  <h1>${esc(audit.title)}</h1>
  <div class="meta">${esc(org)}${audit.location ? ' · ' + esc(audit.location) : ''} &nbsp;·&nbsp; ${date}</div>
</div>

<div class="summary">
  <div class="ring"><div class="ring-inner">${score}</div></div>
  <div>
    <div class="verdict-label">Verdict de conformité</div>
    <div class="verdict">${verdict.label}</div>
    <div class="verdict-sub">${audit.issues_count} non-conformité(s) relevée(s)${ctx.auditorName ? ' · Auditeur : ' + esc(ctx.auditorName) : ''}</div>
  </div>
</div>

<div class="grid">
  <div class="card">
    <div class="card-label">Score</div>
    <div class="card-value" style="color:${color}">${score}</div>
  </div>
  <div class="card">
    <div class="card-label">Statut</div>
    <div class="card-value" style="font-size:17px">${esc(STATUS_LABEL[audit.status] ?? audit.status)}</div>
  </div>
  <div class="card">
    <div class="card-label">Non-conformités</div>
    <div class="card-value" style="color:${audit.issues_count > 0 ? '#DC2626' : '#16A34A'}">${audit.issues_count}</div>
  </div>
  <div class="card">
    <div class="card-label">Score maximum</div>
    <div class="card-value" style="font-size:17px">${audit.max_score} pts</div>
  </div>
</div>

${synthesisSection(audit, ctx)}

${criteriaSection(ctx)}

${actionsSection(ctx)}

<div class="section">
  <h2>Informations</h2>
  <div class="row"><span>Créé le</span><span>${frDate(audit.created_at)}</span></div>
  ${audit.started_at ? `<div class="row"><span>Démarré le</span><span>${frDate(audit.started_at)}</span></div>` : ''}
  ${audit.completed_at ? `<div class="row"><span>Terminé le</span><span>${frDate(audit.completed_at)}</span></div>` : ''}
  ${audit.due_date ? `<div class="row"><span>Échéance</span><span>${frDate(audit.due_date)}</span></div>` : ''}
  ${audit.notes ? `<div class="row"><span>Notes</span><span style="max-width:60%;text-align:right">${esc(audit.notes)}</span></div>` : ''}
</div>

${signatureSection(ctx)}

${
  audit.photos?.length > 0
    ? `
<div class="section">
  <h2>Preuves photo (${audit.photos.length})</h2>
  <p style="font-size:13px;color:#6B7280">${audit.photos.length} preuve(s) photo enregistrée(s) pour cet audit et consultable(s) dans l'application (non incluses dans ce document).</p>
</div>`
    : ''
}

<div class="footer">
  Rapport généré par <strong>OpsPilot</strong> le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<br/>
  Document confidentiel — réservé à un usage interne · Référence ${reference(audit)}
</div>
</div>

<script>
  if(window.matchMedia('print').matches === false) {
    const btn = document.createElement('button');
    btn.className = 'no-print';
    btn.textContent = '🖨 Imprimer / Télécharger PDF';
    btn.style.cssText='position:fixed;bottom:24px;right:24px;background:#2563EB;color:#fff;border:none;padding:14px 20px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 8px 20px rgba(37,99,235,.35)';
    btn.onclick = () => window.print();
    document.body.appendChild(btn);
  }
</script>
</body>
</html>`;
}

export async function exportAuditReport(
  audit: Audit,
  ctx: AuditReportContext = {},
) {
  const html = buildAuditReportHTML(audit, ctx);
  const filename = `rapport-audit-${audit.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}`;

  if (Platform.OS === 'web') {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback : téléchargement direct
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } else {
    const summary = [
      `RAPPORT D'AUDIT — ${audit.title}`,
      `Référence : ${reference(audit)}`,
      `Date : ${frDate(audit.created_at)}`,
      audit.location ? `Lieu : ${audit.location}` : '',
      `Verdict : ${conformityVerdict(audit.score).label}`,
      `Score : ${audit.score != null ? audit.score + '%' : 'Non noté'}`,
      `Non-conformités : ${audit.issues_count}`,
      audit.notes ? `Notes : ${audit.notes}` : '',
      '',
      'Généré par OpsPilot',
    ]
      .filter(Boolean)
      .join('\n');

    await Share.share({ title: `Rapport ${audit.title}`, message: summary });
  }
}
