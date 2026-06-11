// send-transactional — emails transactionnels déclenchés par la base
// (triggers → pg_net). Auth : jeton x-worker-token (platform_settings),
// jamais exposé hors de la base. Envoi via Resend si RESEND_API_KEY est
// posée ; sinon journalisé « skipped » (la mécanique s'active à la clé).
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const APP_URL = 'https://lucasmezen972-ui.github.io/opspilot/';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Clé Resend : secret d'environnement prioritaire, sinon platform_settings
// (posable/rotatable depuis le back-office sans redéploiement).
// L'expéditeur est aussi configurable en base (email_provider.from) :
// bascule vers le domaine vérifié sans redéploiement.
interface EmailConfig {
  key: string;
  from: string;
}
let configCache: EmailConfig | null = null;
async function getEmailConfig(): Promise<EmailConfig> {
  if (configCache) return configCache;
  const { data } = await admin
    .from('platform_settings')
    .select('value')
    .eq('key', 'email_provider')
    .maybeSingle();
  configCache = {
    key:
      Deno.env.get('RESEND_API_KEY') ||
      ((data?.value?.resend_key as string) ?? ''),
    from:
      Deno.env.get('EMAIL_FROM') ||
      ((data?.value?.from as string) ?? 'OpsPilot <onboarding@resend.dev>'),
  };
  return configCache;
}

const layout = (title: string, inner: string) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#111827">
    <div style="background:#2563eb;color:#fff;padding:18px 24px;border-radius:12px 12px 0 0;font-weight:700;font-size:18px">OpsPilot</div>
    <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>
      ${inner}
      <p style="margin-top:24px;color:#9ca3af;font-size:12px">OpsPilot — pilotage des opérations terrain</p>
    </div>
  </div>`;

const button = (href: string, label: string) =>
  `<p style="margin:18px 0"><a href="${href}" style="background:#2563eb;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600;display:inline-block">${label}</a></p>`;

interface Built {
  subject: string;
  html: string;
}

function build(type: string, data: Record<string, string>): Built | null {
  switch (type) {
    case 'welcome':
      return {
        subject: 'Bienvenue sur OpsPilot 🎉',
        html: layout(
          `Bienvenue${data.name ? ', ' + data.name : ''} !`,
          `<p>Votre espace OpsPilot pour <strong>${data.org ?? 'votre organisation'}</strong> est prêt.</p>
           <p>Créez votre premier audit, ajoutez vos produits et invitez votre équipe dès maintenant.</p>
           ${button(APP_URL, 'Ouvrir OpsPilot')}
           <p style="color:#6b7280;font-size:13px">Votre essai gratuit est actif. Vous pouvez activer un abonnement à tout moment depuis l'onglet Abonnement.</p>`,
        ),
      };
    case 'invitation':
      return {
        subject: `Vous êtes invité sur OpsPilot`,
        html: layout(
          'Rejoignez votre équipe sur OpsPilot',
          `<p>Vous avez été invité à rejoindre <strong>${data.org ?? 'une organisation'}</strong> en tant que <strong>${data.role ?? 'membre'}</strong>.</p>
           <p>Créez votre compte avec cette adresse email, puis saisissez le code d'invitation ci-dessous dans l'application :</p>
           <p style="background:#f3f4f6;border-radius:8px;padding:12px;font-family:monospace;font-size:15px;text-align:center">${data.token ?? ''}</p>
           ${button(APP_URL, 'Rejoindre OpsPilot')}`,
        ),
      };
    case 'subscription_active':
      return {
        subject: 'Votre abonnement OpsPilot est actif ✅',
        html: layout(
          'Merci pour votre confiance !',
          `<p>L'abonnement <strong>${data.plan ?? ''}</strong> de <strong>${data.org ?? 'votre organisation'}</strong> est désormais actif.</p>
           <p>Toutes les fonctionnalités sont débloquées sans interruption.</p>
           ${button(APP_URL, 'Accéder à OpsPilot')}`,
        ),
      };
    case 'audit_completed':
      return {
        subject: `Audit terminé : ${data.audit ?? ''}`,
        html: layout(
          "Un audit vient d'être clôturé",
          `<p>L'audit <strong>${data.audit ?? ''}</strong>${data.location ? ` (${data.location})` : ''} de <strong>${data.org ?? 'votre organisation'}</strong> a été terminé${data.auditor ? ` par ${data.auditor}` : ''}.</p>
           ${data.score ? `<p>Score obtenu : <strong>${data.score}%</strong></p>` : ''}
           ${button(APP_URL, "Voir l'audit")}`,
        ),
      };
    case 'training_completed':
      return {
        subject: `Formation terminée : ${data.training ?? ''}`,
        html: layout(
          "Une formation vient d'être validée",
          `<p><strong>${data.person ?? 'Un collaborateur'}</strong> a terminé la formation <strong>${data.training ?? ''}</strong> chez <strong>${data.org ?? 'votre organisation'}</strong>.</p>
           ${data.score ? `<p>Score au quiz : <strong>${data.score}%</strong></p>` : ''}
           ${button(APP_URL, 'Voir la formation')}`,
        ),
      };
    default:
      return null;
  }
}

async function alreadySent(template: string, recipient: string) {
  const { count } = await admin
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('template', template)
    .eq('recipient', recipient)
    .eq('status', 'sent');
  return (count ?? 0) > 0;
}

async function resolveRecipients(
  to: string | undefined,
  orgId: string | undefined,
): Promise<string[]> {
  if (to) return [to];
  if (!orgId) return [];
  const { data } = await admin
    .from('profiles')
    .select('email')
    .eq('organization_id', orgId)
    .eq('role', 'admin');
  return (data ?? []).map((r) => r.email).filter(Boolean) as string[];
}

async function deliver(
  recipient: string,
  template: string,
  built: Built,
  orgId?: string,
) {
  const { key: resendKey, from: emailFrom } = await getEmailConfig();
  if (!resendKey) {
    await admin.from('email_log').insert({
      organization_id: orgId ?? null,
      recipient,
      template,
      status: 'skipped',
      error: 'RESEND_API_KEY absente',
    });
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [recipient],
        subject: built.subject,
        html: built.html,
      }),
    });
    const ok = res.ok;
    await admin.from('email_log').insert({
      organization_id: orgId ?? null,
      recipient,
      template,
      status: ok ? 'sent' : 'error',
      error: ok ? null : (await res.text()).slice(0, 500),
    });
  } catch (e) {
    await admin.from('email_log').insert({
      organization_id: orgId ?? null,
      recipient,
      template,
      status: 'error',
      error: String(e).slice(0, 500),
    });
  }
}

Deno.serve(async (req) => {
  const token = req.headers.get('x-worker-token') ?? '';
  const { data: expected } = await admin
    .from('platform_settings')
    .select('value')
    .eq('key', 'email_worker_token')
    .single();
  if (!token || token !== expected?.value?.token) {
    return new Response(JSON.stringify({ error: 'jeton invalide' }), {
      status: 401,
    });
  }

  const { type, to, organization_id, data } = await req
    .json()
    .catch(() => ({}));
  const built = build(type, data ?? {});
  if (!built) {
    return new Response(JSON.stringify({ error: 'type inconnu' }), {
      status: 400,
    });
  }

  const recipients = await resolveRecipients(to, organization_id);
  // Déduplication par destinataire uniquement pour les emails « une fois » ;
  // les notifications d'audit/formation se répètent à chaque événement.
  const dedup = new Set(['welcome', 'subscription_active']);
  let sent = 0;
  for (const r of recipients) {
    if (dedup.has(type) && (await alreadySent(type, r))) continue;
    await deliver(r, type, built, organization_id);
    sent++;
  }
  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
