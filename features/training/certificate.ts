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
      background: #ECFDF5;
      border: 1.5px solid #10B981;
      color: #065F46;
      font-size: 15px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 8px;
      margin-bottom: 36px;
    }
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
      ✓ Score obtenu : ${ctx.score} %
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
    ...ctx,
  });

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}
