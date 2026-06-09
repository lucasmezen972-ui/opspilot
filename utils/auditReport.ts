import { Platform, Share } from 'react-native';

import type { Audit } from '../lib/supabase';

function scoreColor(score: number | null | undefined): string {
  if (score == null) return '#6B7280';
  if (score >= 80) return '#16A34A';
  if (score >= 60) return '#D97706';
  return '#DC2626';
}

function buildHTML(audit: Audit): string {
  const date = audit.completed_at
    ? new Date(audit.completed_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : new Date(audit.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' });

  const score = audit.score != null ? `${audit.score}%` : 'Non noté';
  const color = scoreColor(audit.score);

  const statusLabel: Record<string, string> = {
    pending: 'À faire',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Rapport d'audit — ${audit.title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Arial, sans-serif; background: #F8FAFC; color: #111827; padding: 32px; }
  .header { background: #2563EB; color: #fff; border-radius: 16px; padding: 28px 32px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .header p  { font-size: 14px; opacity: .8; }
  .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  .card-label { font-size: 12px; color: #6B7280; margin-bottom: 6px; }
  .card-value { font-size: 26px; font-weight: 700; }
  .section { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 20px; }
  .section h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .footer { text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 32px; }
  @media print {
    body { background: #fff; padding: 16px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="logo">OP</div>
  <h1>${audit.title}</h1>
  <p>${audit.location ?? ''} &nbsp;·&nbsp; ${date}</p>
</div>

<div class="grid">
  <div class="card">
    <div class="card-label">Score</div>
    <div class="card-value" style="color:${color}">${score}</div>
  </div>
  <div class="card">
    <div class="card-label">Statut</div>
    <div class="card-value" style="font-size:18px">${statusLabel[audit.status] ?? audit.status}</div>
  </div>
  <div class="card">
    <div class="card-label">Non-conformités</div>
    <div class="card-value" style="color:${audit.issues_count > 0 ? '#DC2626' : '#16A34A'}">${audit.issues_count}</div>
  </div>
  <div class="card">
    <div class="card-label">Score max</div>
    <div class="card-value" style="font-size:18px">${audit.max_score} pts</div>
  </div>
</div>

<div class="section">
  <h2>Informations</h2>
  <div class="row"><span>Créé le</span><span>${new Date(audit.created_at).toLocaleDateString('fr-FR')}</span></div>
  ${audit.started_at ? `<div class="row"><span>Démarré le</span><span>${new Date(audit.started_at).toLocaleDateString('fr-FR')}</span></div>` : ''}
  ${audit.completed_at ? `<div class="row"><span>Terminé le</span><span>${new Date(audit.completed_at).toLocaleDateString('fr-FR')}</span></div>` : ''}
  ${audit.due_date ? `<div class="row"><span>Échéance</span><span>${new Date(audit.due_date).toLocaleDateString('fr-FR')}</span></div>` : ''}
  ${audit.notes ? `<div class="row"><span>Notes</span><span style="max-width:60%;text-align:right">${audit.notes}</span></div>` : ''}
</div>

${audit.photos?.length > 0 ? `
<div class="section">
  <h2>Photos (${audit.photos.length})</h2>
  <p style="font-size:13px;color:#6B7280">${audit.photos.length} photo(s) jointe(s) à cet audit.</p>
</div>` : ''}

<div class="footer">
  Rapport généré par <strong>OpsPilot</strong> · ${new Date().toLocaleDateString('fr-FR')}
</div>

<script>
  if(window.matchMedia('print').matches === false) {
    const btn = document.createElement('button');
    btn.textContent = '🖨 Imprimer / Télécharger PDF';
    btn.style.cssText='position:fixed;bottom:24px;right:24px;background:#2563EB;color:#fff;border:none;padding:14px 20px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,.4)';
    btn.onclick = () => window.print();
    document.body.appendChild(btn);
  }
</script>
</body>
</html>`;
}

export async function exportAuditReport(audit: Audit) {
  const html = buildHTML(audit);
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
      `Date : ${new Date(audit.created_at).toLocaleDateString('fr-FR')}`,
      audit.location ? `Lieu : ${audit.location}` : '',
      `Score : ${audit.score != null ? audit.score + '%' : 'Non noté'}`,
      `Non-conformités : ${audit.issues_count}`,
      audit.notes ? `Notes : ${audit.notes}` : '',
      '',
      'Généré par OpsPilot',
    ].filter(Boolean).join('\n');

    await Share.share({ title: `Rapport ${audit.title}`, message: summary });
  }
}
