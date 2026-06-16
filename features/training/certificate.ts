import type { TrainingCertificate } from '../../lib/supabase';

export interface CertificateContext {
  fullName: string;
  trainingTitle: string;
  category?: string | null;
  score: number;
  issuedAt: string;
  certificateNumber: string;
  supervisorName?: string;
  organizationName?: string;
  /** Matricule / identifiant salarié. */
  employeeId?: string | null;
  /** Poste occupé. */
  position?: string | null;
  /** Magasin / établissement. */
  store?: string | null;
  /** Durée de la formation (minutes). */
  durationMinutes?: number | null;
  /** Version du référentiel d'évaluation. */
  version?: string | null;
  /** Numéro de la tentative validante. */
  attemptNumber?: number | null;
  /** Statut explicite de l'attestation. */
  status?: 'validé' | 'échoué' | null;
}

/**
 * Génère un numéro de certificat unique (OPS-AAAA-XXXXX).
 */
export function generateCertificateNumber(
  userId: string,
  trainingId: string,
): string {
  const year = new Date().getFullYear();
  // Hash de Horner avec modulo dans la boucle : évite le débordement en
  // flottant (perte de précision) de l'accumulation brute et répartit mieux
  // les numéros sur l'espace disponible.
  const source = `${userId}:${trainingId}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000;
  }
  return `OPS-${year}-${String(hash).padStart(5, '0')}`;
}

/**
 * Construit le HTML d'un certificat quasi-certifiant pour affichage ou impression.
 */
export function buildCertificateHTML(ctx: CertificateContext): string {
  const date = new Date(ctx.issuedAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const status = ctx.status ?? 'validé';
  const isPassed = status === 'validé';
  const duration =
    typeof ctx.durationMinutes === 'number'
      ? `${ctx.durationMinutes} min`
      : '—';
  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- empty strings after trim should fall through to '—' */
  const detailRows: [string, string][] = [
    ['Matricule', ctx.employeeId?.trim() || '—'],
    ['Poste', ctx.position?.trim() || '—'],
    ['Magasin', ctx.store?.trim() || '—'],
    ['Catégorie', ctx.category?.trim() || '—'],
    ['Durée', duration],
    ['Version évaluation', ctx.version?.trim() || '—'],
    [
      'Tentative',
      typeof ctx.attemptNumber === 'number' ? `N° ${ctx.attemptNumber}` : '—',
    ],
  ];
  /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
  const detailsHTML = detailRows
    .map(
      ([label, value]) =>
        `<div class="detail"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Certificat — ${ctx.trainingTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 32px;
    }
    .certificate {
      background: #FFFFFF;
      border: 2px solid #2563EB;
      border-radius: 16px;
      max-width: 760px;
      width: 100%;
      padding: 56px 64px;
      position: relative;
      box-shadow: 0 8px 32px rgba(37,99,235,0.12);
    }
    .corner {
      position: absolute;
      width: 48px;
      height: 48px;
      border-color: #2563EB;
      border-style: solid;
      opacity: 0.35;
    }
    .corner-tl { top: 12px; left: 12px; border-width: 3px 0 0 3px; border-radius: 6px 0 0 0; }
    .corner-tr { top: 12px; right: 12px; border-width: 3px 3px 0 0; border-radius: 0 6px 0 0; }
    .corner-bl { bottom: 12px; left: 12px; border-width: 0 0 3px 3px; border-radius: 0 0 0 6px; }
    .corner-br { bottom: 12px; right: 12px; border-width: 0 3px 3px 0; border-radius: 0 0 6px 0; }
    .logo-line {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    .logo-badge {
      background: #2563EB;
      color: #fff;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 6px 12px;
      border-radius: 6px;
    }
    .logo-org {
      color: #6B7280;
      font-size: 13px;
      font-weight: 600;
    }
    .eyebrow {
      color: #2563EB;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h1 {
      color: #111827;
      font-size: 36px;
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 28px;
    }
    .recipient-label {
      color: #6B7280;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .recipient-name {
      color: #111827;
      font-size: 26px;
      font-weight: 800;
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 12px;
      margin-bottom: 28px;
    }
    .body-text {
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .score-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: ${isPassed ? '#ECFDF5' : '#FEF2F2'};
      border: 1.5px solid ${isPassed ? '#10B981' : '#EF4444'};
      color: ${isPassed ? '#065F46' : '#991B1B'};
      font-size: 15px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 8px;
      margin-bottom: 28px;
    }
    .details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 24px;
      padding: 20px 0;
      margin-bottom: 28px;
      border-top: 1px solid #E5E7EB;
      border-bottom: 1px solid #E5E7EB;
    }
    .detail { display: flex; flex-direction: column; gap: 2px; }
    .detail-label {
      color: #9CA3AF;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .detail-value { color: #111827; font-size: 14px; font-weight: 600; }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 24px;
      border-top: 1px solid #E5E7EB;
    }
    .sig-block { text-align: center; }
    .sig-line {
      width: 140px;
      height: 2px;
      background: #D1D5DB;
      margin: 0 auto 6px;
    }
    .sig-label { color: #6B7280; font-size: 11px; font-weight: 600; }
    .sig-name { color: #111827; font-size: 13px; font-weight: 700; margin-top: 2px; }
    .cert-info { text-align: right; }
    .cert-num { color: #6B7280; font-size: 11px; margin-bottom: 2px; }
    .cert-num span { color: #111827; font-weight: 700; }
    .cert-date { color: #6B7280; font-size: 11px; }
    @media print {
      body { padding: 0; background: white; }
      .certificate { box-shadow: none; border-width: 1px; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <div class="logo-line">
      <span class="logo-badge">OpsPilot</span>
      ${ctx.organizationName ? `<span class="logo-org">${ctx.organizationName}</span>` : ''}
    </div>

    <div class="eyebrow">Attestation de formation professionnelle</div>
    <h1>${ctx.trainingTitle}</h1>

    <div class="recipient-label">Délivré à</div>
    <div class="recipient-name">${ctx.fullName}</div>

    <p class="body-text">
      La présente attestation certifie que <strong>${ctx.fullName}</strong> a
      suivi et validé avec succès la formation <em>${ctx.trainingTitle}</em>${
        ctx.category ? ` (${ctx.category})` : ''
      }.
      Cette formation répond aux exigences réglementaires et procédurales de
      l'organisation.
    </p>

    <div class="score-badge">
      ${isPassed ? '✓' : '✗'} ${isPassed ? 'Formation validée' : 'Formation non validée'} — Score obtenu : ${ctx.score} %
    </div>

    <div class="details">
      ${detailsHTML}
    </div>

    <div class="footer">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Responsable formation</div>
        <div class="sig-name">${ctx.supervisorName ?? 'Responsable RH'}</div>
      </div>
      <div class="cert-info">
        <div class="cert-num">N° <span>${ctx.certificateNumber}</span></div>
        <div class="cert-date">Émis le ${date}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Ouvre le certificat dans un nouvel onglet (web) ou log un message (natif sans Share API).
 */
export function openCertificate(
  cert: TrainingCertificate,
  ctx: Omit<
    CertificateContext,
    'fullName' | 'trainingTitle' | 'score' | 'issuedAt' | 'certificateNumber'
  >,
): void {
  const html = buildCertificateHTML({
    fullName: cert.full_name,
    trainingTitle: cert.training_title,
    score: cert.score,
    issuedAt: cert.issued_at,
    certificateNumber: cert.certificate_number,
    employeeId: cert.employee_id,
    position: cert.position,
    store: cert.store_name,
    category: cert.category,
    durationMinutes: cert.duration_minutes,
    version: cert.quiz_version,
    attemptNumber: cert.attempt_number,
    status: cert.status,
    ...ctx,
  });

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}
