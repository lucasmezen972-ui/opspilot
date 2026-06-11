// email-worker — relances d'essai automatiques (cron quotidien pg_cron).
// Auth : jeton statique x-worker-token (stocké dans platform_settings,
// embarqué dans la commande cron). Envoi via Resend si RESEND_API_KEY est
// posée en secret ; sinon les envois sont journalisés en « skipped » et la
// mécanique s'activera dès que la clé existe.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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

interface Reminder {
  template: string;
  subject: string;
  html: (org: string, date: string) => string;
}

const TEMPLATES: Record<string, Reminder> = {
  trial_j3: {
    template: 'trial_j3',
    subject: 'Votre essai OpsPilot expire dans 3 jours',
    html: (org, date) => `
      <p>Bonjour,</p>
      <p>L'essai gratuit d'OpsPilot pour <strong>${org}</strong> se termine le <strong>${date}</strong>.</p>
      <p>Pour continuer à piloter vos audits, actions et équipes sans interruption,
      activez votre abonnement depuis l'onglet <em>Abonnement</em> de l'application.</p>
      <p><a href="https://lucasmezen972-ui.github.io/opspilot/">Ouvrir OpsPilot</a></p>
      <p>— L'équipe OpsPilot</p>`,
  },
  trial_expired: {
    template: 'trial_expired',
    subject: 'Votre essai OpsPilot est terminé',
    html: (org) => `
      <p>Bonjour,</p>
      <p>L'essai gratuit d'OpsPilot pour <strong>${org}</strong> est arrivé à échéance.</p>
      <p>Vos données sont conservées : réactivez votre espace à tout moment depuis
      l'onglet <em>Abonnement</em>.</p>
      <p><a href="https://lucasmezen972-ui.github.io/opspilot/">Réactiver mon espace</a></p>
      <p>— L'équipe OpsPilot</p>`,
  },
};

async function alreadySent(template: string, orgId: string): Promise<boolean> {
  const { count } = await admin
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('template', template)
    .eq('organization_id', orgId)
    .eq('status', 'sent');
  return (count ?? 0) > 0;
}

async function sendEmail(
  to: string,
  reminder: Reminder,
  orgName: string,
  orgId: string,
  date: string,
) {
  const { key: resendKey, from: emailFrom } = await getEmailConfig();
  if (!resendKey) {
    await admin.from('email_log').insert({
      organization_id: orgId,
      recipient: to,
      template: reminder.template,
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
        to: [to],
        subject: reminder.subject,
        html: reminder.html(orgName, date),
      }),
    });
    const ok = res.ok;
    const detail = ok ? null : await res.text();
    await admin.from('email_log').insert({
      organization_id: orgId,
      recipient: to,
      template: reminder.template,
      status: ok ? 'sent' : 'error',
      error: detail?.slice(0, 500) ?? null,
    });
  } catch (e) {
    await admin.from('email_log').insert({
      organization_id: orgId,
      recipient: to,
      template: reminder.template,
      status: 'error',
      error: String(e).slice(0, 500),
    });
  }
}

Deno.serve(async (req) => {
  // Jeton statique : seule la tâche cron (qui le lit en base) le connaît.
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

  const now = Date.now();
  const in3d = new Date(now + 3 * 86400000).toISOString();
  const nowIso = new Date(now).toISOString();
  let processed = 0;

  // Essais qui expirent dans ≤ 3 jours (relance J-3) ou déjà expirés (J0).
  const { data: subs } = await admin
    .from('subscriptions')
    .select('organization_id, trial_ends_at, organizations(name)')
    .eq('status', 'trialing')
    .lte('trial_ends_at', in3d);

  for (const sub of subs ?? []) {
    const orgId = sub.organization_id;
    const orgName =
      (sub.organizations as { name?: string } | null)?.name ??
      'votre organisation';
    const expired = (sub.trial_ends_at ?? '') <= nowIso;
    const reminder = expired ? TEMPLATES.trial_expired : TEMPLATES.trial_j3;
    if (await alreadySent(reminder.template, orgId)) continue;

    const { data: admins } = await admin
      .from('profiles')
      .select('email')
      .eq('organization_id', orgId)
      .eq('role', 'admin');
    const date = sub.trial_ends_at
      ? new Date(sub.trial_ends_at).toLocaleDateString('fr-FR')
      : '';
    for (const a of admins ?? []) {
      if (a.email) {
        await sendEmail(a.email, reminder, orgName, orgId, date);
        processed++;
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, processed }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
