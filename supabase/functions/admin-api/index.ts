// admin-api — API du back-office superadmin (gestion utilisateurs, orgs,
// abonnements, réglages). Auth manuelle (verify_jwt=false) : chaque requête
// doit porter le JWT d'un profil « superadmin », vérifié via service_role.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function requireSuperadmin(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { error: json({ error: 'Non authentifié' }, 401) };

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return { error: json({ error: 'Session invalide' }, 401) };
  }
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();
  const role = profile?.role ?? '';
  if (role !== 'superadmin' && role !== 'support') {
    return {
      error: json({ error: 'Accès réservé à l’équipe plateforme' }, 403),
    };
  }
  // Le rôle « support » est en lecture seule : toute mutation est refusée.
  if (role === 'support' && req.method !== 'GET' && req.method !== 'OPTIONS') {
    return {
      error: json(
        { error: 'Lecture seule : action réservée au superadmin' },
        403,
      ),
    };
  }

  // 2FA : si un facteur TOTP vérifié existe, exiger une session aal2
  // (pas de porte dérobée une fois la 2FA activée).
  const { data: factorData } = await admin.auth.admin.mfa.listFactors({
    userId: data.user.id,
  });
  const hasTotp = (factorData?.factors ?? []).some(
    (f) => f.factor_type === 'totp' && f.status === 'verified',
  );
  if (hasTotp) {
    let aal = '';
    try {
      aal = JSON.parse(atob(token.split('.')[1] ?? ''))?.aal ?? '';
    } catch {
      aal = '';
    }
    if (aal !== 'aal2') {
      return { error: json({ error: 'Validation 2FA requise' }, 401) };
    }
  }
  return { user: data.user };
}

function tempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `OpsPilot-${out}!`;
}

async function logAction(
  actor: { id: string; email?: string },
  action: string,
  target: Record<string, unknown>,
) {
  await admin.from('admin_audit_log').insert({
    actor_id: actor.id,
    actor_email: actor.email ?? null,
    action,
    target,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const gate = await requireSuperadmin(req);
  if ('error' in gate && gate.error) return gate.error;
  const actor = { id: gate.user!.id, email: gate.user!.email };

  const url = new URL(req.url);
  // chemin après /admin-api : ex. ['users', ':id']
  const parts = url.pathname.split('/').filter(Boolean).slice(1);
  const route = `${req.method} /${parts[0] ?? ''}`;

  try {
    switch (route) {
      case 'GET /stats': {
        const [orgs, users, audits, subs] = await Promise.all([
          admin
            .from('organizations')
            .select('id', { count: 'exact', head: true }),
          admin.from('profiles').select('id', { count: 'exact', head: true }),
          admin.from('audits').select('id', { count: 'exact', head: true }),
          admin.from('subscriptions').select('status'),
        ]);
        const byStatus: Record<string, number> = {};
        for (const s of subs.data ?? []) {
          byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
        }
        return json({
          organizations: orgs.count ?? 0,
          users: users.count ?? 0,
          audits: audits.count ?? 0,
          subscriptions: byStatus,
        });
      }

      case 'GET /dashboard': {
        const now = Date.now();
        const d7 = new Date(now - 7 * 86400000).toISOString();
        const d30 = new Date(now - 30 * 86400000).toISOString();
        const in7d = new Date(now + 7 * 86400000).toISOString();
        const [
          expiring,
          recentUsers,
          recentAudits,
          audits7,
          audits30,
          users30,
        ] = await Promise.all([
          admin
            .from('subscriptions')
            .select('organization_id, trial_ends_at, organizations(name)')
            .eq('status', 'trialing')
            .lte('trial_ends_at', in7d)
            .order('trial_ends_at'),
          admin
            .from('profiles')
            .select('email, full_name, created_at, organizations(name)')
            .order('created_at', { ascending: false })
            .limit(5),
          admin
            .from('audits')
            .select('title, status, created_at, organizations(name)')
            .order('created_at', { ascending: false })
            .limit(5),
          admin
            .from('audits')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', d7),
          admin
            .from('audits')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', d30),
          admin
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', d30),
        ]);
        return json({
          expiring_trials: expiring.data ?? [],
          recent_users: recentUsers.data ?? [],
          recent_audits: recentAudits.data ?? [],
          trends: {
            audits_7d: audits7.count ?? 0,
            audits_30d: audits30.count ?? 0,
            new_users_30d: users30.count ?? 0,
          },
        });
      }

      case 'GET /organizations': {
        const { data, error } = await admin
          .from('organizations')
          .select(
            'id, name, created_at, subscriptions(plan, status, trial_ends_at, current_period_end, stripe_customer_id), profiles(count)',
          )
          .order('created_at', { ascending: false });
        if (error) throw error;
        return json({ organizations: data });
      }

      case 'GET /users': {
        const { data, error } = await admin
          .from('profiles')
          .select(
            'id, email, full_name, role, is_active, last_active, created_at, organization_id, organizations(name)',
          )
          .order('created_at', { ascending: false });
        if (error) throw error;
        return json({ users: data });
      }

      case 'POST /users': {
        const body = await req.json();
        const { email, password, full_name, role, organization_id } = body;
        if (!email || !password) {
          return json({ error: 'email et mot de passe requis' }, 400);
        }
        const allowed = [
          'support',
          'admin',
          'manager',
          'employé',
          'employee',
          'stagiaire',
        ];
        if (role && !allowed.includes(role)) {
          return json({ error: `rôle invalide (${allowed.join(', ')})` }, 400);
        }
        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name ?? null },
        });
        if (error) return json({ error: error.message }, 400);
        const uid = created.user.id;
        await admin.from('users').upsert({ id: uid, email });
        const { error: pErr } = await admin.from('profiles').upsert({
          id: uid,
          email,
          full_name: full_name ?? null,
          role: role ?? 'employé',
          organization_id: organization_id ?? null,
        });
        if (pErr) return json({ error: pErr.message }, 400);
        await logAction(actor, 'user.create', { id: uid, email, role });
        return json({ ok: true, id: uid });
      }

      case 'PATCH /users': {
        const id = parts[1];
        if (!id) return json({ error: 'id manquant' }, 400);
        const body = await req.json();
        const updates: Record<string, unknown> = {};
        for (const k of [
          'role',
          'is_active',
          'organization_id',
          'full_name',
          'store_id',
        ]) {
          if (k in body) updates[k] = body[k];
        }
        if (updates.role === 'superadmin') {
          return json({ error: 'promotion superadmin interdite via API' }, 400);
        }
        const { error } = await admin
          .from('profiles')
          .update(updates)
          .eq('id', id);
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'user.update', { id, ...updates });
        return json({ ok: true });
      }

      case 'POST /reset-password': {
        const id = parts[1];
        if (!id) return json({ error: 'id manquant' }, 400);
        const { data: target } = await admin
          .from('profiles')
          .select('role, email')
          .eq('id', id)
          .single();
        if (target?.role === 'superadmin' && id !== actor.id) {
          return json(
            { error: 'impossible de réinitialiser un autre superadmin' },
            400,
          );
        }
        const password = tempPassword();
        const { error } = await admin.auth.admin.updateUserById(id, {
          password,
        });
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'user.reset_password', {
          id,
          email: target?.email,
        });
        return json({ ok: true, password });
      }

      case 'DELETE /users': {
        const id = parts[1];
        if (!id) return json({ error: 'id manquant' }, 400);
        if (id === actor.id) {
          return json(
            { error: 'impossible de supprimer son propre compte' },
            400,
          );
        }
        const { data: target } = await admin
          .from('profiles')
          .select('role, email')
          .eq('id', id)
          .single();
        if (target?.role === 'superadmin') {
          return json({ error: 'impossible de supprimer un superadmin' }, 400);
        }
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) return json({ error: error.message }, 400);
        await admin.from('profiles').delete().eq('id', id);
        await logAction(actor, 'user.delete', { id, email: target?.email });
        return json({ ok: true });
      }

      case 'POST /organizations': {
        const { name, store_name } = await req.json();
        if (!name?.trim()) return json({ error: 'nom requis' }, 400);
        const { data: org, error } = await admin
          .from('organizations')
          .insert({ name: name.trim() })
          .select('id')
          .single();
        if (error) return json({ error: error.message }, 400);
        if (store_name?.trim()) {
          await admin
            .from('stores')
            .insert({ organization_id: org.id, name: store_name.trim() });
        }
        const { data: trialSetting } = await admin
          .from('platform_settings')
          .select('value')
          .eq('key', 'defaults')
          .maybeSingle();
        const trialDays = Number(trialSetting?.value?.trial_days) || 14;
        await admin.from('subscriptions').upsert(
          {
            organization_id: org.id,
            plan: 'trial',
            status: 'trialing',
            trial_ends_at: new Date(
              Date.now() + trialDays * 86400000,
            ).toISOString(),
          },
          { onConflict: 'organization_id' },
        );
        await logAction(actor, 'organization.create', {
          id: org.id,
          name: name.trim(),
        });
        return json({ ok: true, id: org.id });
      }

      case 'PATCH /organizations': {
        const id = parts[1];
        const { name } = await req.json();
        if (!id || !name?.trim())
          return json({ error: 'id et nom requis' }, 400);
        const { error } = await admin
          .from('organizations')
          .update({ name: name.trim() })
          .eq('id', id);
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'organization.rename', {
          id,
          name: name.trim(),
        });
        return json({ ok: true });
      }

      case 'GET /organization-detail': {
        const id = parts[1];
        if (!id) return json({ error: 'id manquant' }, 400);
        const [members, audits, actions, products] = await Promise.all([
          admin
            .from('profiles')
            .select('id, email, full_name, role, is_active')
            .eq('organization_id', id)
            .order('full_name'),
          admin
            .from('audits')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', id),
          admin
            .from('corrective_actions')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', id),
          admin
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', id),
        ]);
        return json({
          members: members.data ?? [],
          counts: {
            audits: audits.count ?? 0,
            actions: actions.count ?? 0,
            products: products.count ?? 0,
          },
        });
      }

      case 'POST /impersonate': {
        const id = parts[1];
        if (!id) return json({ error: 'id manquant' }, 400);
        const { data: target } = await admin
          .from('profiles')
          .select('role, email')
          .eq('id', id)
          .single();
        if (!target?.email)
          return json({ error: 'utilisateur introuvable' }, 404);
        if (target.role === 'superadmin') {
          return json(
            { error: 'impersonation d’un superadmin interdite' },
            400,
          );
        }
        const { data: link, error } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: target.email,
          options: {
            redirectTo: 'https://lucasmezen972-ui.github.io/opspilot/',
          },
        });
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'user.impersonate', {
          id,
          email: target.email,
        });
        return json({ ok: true, link: link.properties?.action_link });
      }

      case 'GET /stores': {
        const orgId = parts[1];
        if (!orgId) return json({ error: 'organization_id manquant' }, 400);
        const { data, error } = await admin
          .from('stores')
          .select('id, name, city, is_active, created_at')
          .eq('organization_id', orgId)
          .order('name');
        if (error) throw error;
        return json({ stores: data });
      }

      case 'POST /stores': {
        const { organization_id, name, city } = await req.json();
        if (!organization_id || !name?.trim()) {
          return json({ error: 'organization_id et nom requis' }, 400);
        }
        const { data: store, error } = await admin
          .from('stores')
          .insert({
            organization_id,
            name: name.trim(),
            city: city?.trim() || null,
          })
          .select('id')
          .single();
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'store.create', {
          id: store.id,
          organization_id,
          name: name.trim(),
        });
        return json({ ok: true, id: store.id });
      }

      case 'PATCH /stores': {
        const id = parts[1];
        if (!id) return json({ error: 'id manquant' }, 400);
        const body = await req.json();
        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        for (const k of ['name', 'city', 'is_active']) {
          if (k in body) updates[k] = body[k];
        }
        const { error } = await admin
          .from('stores')
          .update(updates)
          .eq('id', id);
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'store.update', { id, ...updates });
        return json({ ok: true });
      }

      case 'GET /announcements': {
        const { data, error } = await admin
          .from('announcements')
          .select(
            'id, title, body, level, organization_id, organizations(name), starts_at, ends_at, is_active, created_at',
          )
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return json({ announcements: data });
      }

      case 'POST /announcements': {
        const { title, body, level, organization_id, ends_at } =
          await req.json();
        if (!title?.trim()) return json({ error: 'titre requis' }, 400);
        const { error } = await admin.from('announcements').insert({
          title: title.trim(),
          body: body?.trim() || null,
          level: ['info', 'warning', 'success'].includes(level)
            ? level
            : 'info',
          organization_id: organization_id || null,
          ends_at: ends_at || null,
          created_by: actor.id,
        });
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'announcement.create', {
          title: title.trim(),
          organization_id: organization_id || 'toutes',
        });
        return json({ ok: true });
      }

      case 'PATCH /announcements': {
        const id = parts[1];
        const { is_active } = await req.json();
        if (!id) return json({ error: 'id manquant' }, 400);
        const { error } = await admin
          .from('announcements')
          .update({ is_active: !!is_active })
          .eq('id', id);
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'announcement.toggle', { id, is_active });
        return json({ ok: true });
      }

      case 'GET /export-organization': {
        const id = parts[1];
        if (!id) return json({ error: 'id manquant' }, 400);
        const tables = [
          'profiles',
          'stores',
          'audits',
          'corrective_actions',
          'products',
          'tasks',
          'trainings',
          'subscriptions',
          'app_settings',
        ];
        const dump: Record<string, unknown> = {};
        const { data: org } = await admin
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();
        dump.organization = org;
        for (const t of tables) {
          const { data } = await admin
            .from(t)
            .select('*')
            .eq('organization_id', id);
          dump[t] = data ?? [];
        }
        await logAction(actor, 'organization.export', { id });
        return json({ export: dump, exported_at: new Date().toISOString() });
      }

      case 'DELETE /organizations': {
        const id = parts[1];
        const confirm = url.searchParams.get('confirm') ?? '';
        if (!id) return json({ error: 'id manquant' }, 400);
        const { data: org } = await admin
          .from('organizations')
          .select('name')
          .eq('id', id)
          .single();
        if (!org) return json({ error: 'organisation introuvable' }, 404);
        if (confirm !== org.name) {
          return json(
            { error: 'confirmation invalide : saisis le nom exact' },
            400,
          );
        }
        // Supprime les comptes auth des membres puis l'organisation
        // (les tables liées partent en cascade).
        const { data: members } = await admin
          .from('profiles')
          .select('id, role')
          .eq('organization_id', id);
        for (const m of members ?? []) {
          if (m.role === 'superadmin') continue;
          await admin.auth.admin.deleteUser(m.id).catch(() => {});
        }
        const { error } = await admin
          .from('organizations')
          .delete()
          .eq('id', id);
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'organization.delete', {
          id,
          name: org.name,
          members: (members ?? []).length,
        });
        return json({ ok: true });
      }

      case 'GET /organization-activity': {
        const id = parts[1];
        if (!id) return json({ error: 'id manquant' }, 400);
        const since = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data, error } = await admin
          .from('audits')
          .select('created_at')
          .eq('organization_id', id)
          .gte('created_at', since);
        if (error) throw error;
        const perDay: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
          perDay[
            new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
          ] = 0;
        }
        for (const a of data ?? []) {
          const day = (a.created_at ?? '').slice(0, 10);
          if (day in perDay) perDay[day]++;
        }
        return json({ activity: perDay });
      }

      case 'GET /billing-overview': {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
        if (!stripeKey) {
          return json({ configured: false });
        }
        const auth = { Authorization: `Bearer ${stripeKey}` };
        const [subsRes, invRes] = await Promise.all([
          fetch(
            'https://api.stripe.com/v1/subscriptions?status=active&limit=100&expand[]=data.items',
            { headers: auth },
          ),
          fetch('https://api.stripe.com/v1/invoices?limit=10', {
            headers: auth,
          }),
        ]);
        const subs = await subsRes.json();
        const invoices = await invRes.json();
        let mrrCents = 0;
        for (const sub of subs.data ?? []) {
          for (const item of sub.items?.data ?? []) {
            const price = item.price;
            if (!price?.unit_amount) continue;
            const qty = item.quantity ?? 1;
            const interval = price.recurring?.interval;
            const count = price.recurring?.interval_count ?? 1;
            if (interval === 'month') {
              mrrCents += (price.unit_amount * qty) / count;
            } else if (interval === 'year') {
              mrrCents += (price.unit_amount * qty) / (12 * count);
            }
          }
        }
        return json({
          configured: true,
          mrr: Math.round(mrrCents) / 100,
          active_subscriptions: (subs.data ?? []).length,
          invoices: (invoices.data ?? []).map((i: Record<string, unknown>) => ({
            number: i.number,
            amount: ((i.total as number) ?? 0) / 100,
            currency: i.currency,
            status: i.status,
            created: i.created,
            customer_email: i.customer_email,
          })),
        });
      }

      case 'GET /health': {
        const [cron, emails, dbSize, logCount] = await Promise.all([
          admin.rpc('admin_cron_status'),
          admin
            .from('email_log')
            .select('recipient, template, status, error, created_at')
            .order('created_at', { ascending: false })
            .limit(20),
          admin.rpc('admin_db_size'),
          admin
            .from('admin_audit_log')
            .select('id', { count: 'exact', head: true }),
        ]);
        return json({
          cron: cron.data ?? [],
          emails: emails.data ?? [],
          db_size: dbSize.data ?? null,
          audit_log_count: logCount.count ?? 0,
        });
      }

      case 'GET /platform-settings': {
        const { data, error } = await admin
          .from('platform_settings')
          .select('key, value, updated_at')
          .order('key');
        if (error) throw error;
        // Les secrets ne sortent JAMAIS : on n'expose qu'un statut.
        const SECRET_KEYS = ['email_worker_token', 'email_provider'];
        const settings = (data ?? []).filter(
          (r) => !SECRET_KEYS.includes(r.key),
        );
        const provider = (data ?? []).find((r) => r.key === 'email_provider');
        const emailConfigured = Boolean(
          Deno.env.get('RESEND_API_KEY') || provider?.value?.resend_key,
        );
        return json({ settings, email_configured: emailConfigured });
      }

      case 'PUT /platform-settings': {
        const { key, value } = await req.json();
        if (!key || key === 'email_worker_token') {
          return json({ error: 'clé invalide' }, 400);
        }
        let toStore = value ?? {};
        if (key === 'email_provider') {
          const resendKey = String(value?.resend_key ?? '').trim();
          if (!resendKey.startsWith('re_')) {
            return json({ error: 'clé Resend invalide (format re_…)' }, 400);
          }
          toStore = { resend_key: resendKey };
        }
        const { error } = await admin
          .from('platform_settings')
          .upsert(
            { key, value: toStore, updated_at: new Date().toISOString() },
            { onConflict: 'key' },
          );
        if (error) return json({ error: error.message }, 400);
        // Jamais la valeur d'un secret dans le journal.
        await logAction(actor, 'platform.update', {
          key,
          value: key === 'email_provider' ? { resend_key: '***' } : toStore,
        });
        return json({ ok: true });
      }

      case 'GET /audit-log': {
        const { data, error } = await admin
          .from('admin_audit_log')
          .select('actor_email, action, target, created_at')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        return json({ log: data });
      }

      case 'PATCH /subscriptions': {
        const orgId = parts[1];
        if (!orgId) return json({ error: 'organization_id manquant' }, 400);
        const body = await req.json();
        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        for (const k of ['status', 'plan', 'trial_ends_at']) {
          if (k in body) updates[k] = body[k];
        }
        const { error } = await admin
          .from('subscriptions')
          .upsert(
            { organization_id: orgId, ...updates },
            { onConflict: 'organization_id' },
          );
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'subscription.update', { orgId, ...updates });
        return json({ ok: true });
      }

      case 'GET /settings': {
        const orgId = parts[1];
        const { data, error } = await admin
          .from('app_settings')
          .select('key, value, updated_at')
          .eq('organization_id', orgId)
          .order('key');
        if (error) throw error;
        return json({ settings: data });
      }

      case 'PUT /settings': {
        const orgId = parts[1];
        const { key, value } = await req.json();
        if (!orgId || !key)
          return json({ error: 'organization_id et key requis' }, 400);
        const { error } = await admin.from('app_settings').upsert(
          {
            organization_id: orgId,
            key,
            value: value ?? {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,key' },
        );
        if (error) return json({ error: error.message }, 400);
        await logAction(actor, 'settings.update', { orgId, key, value });
        return json({ ok: true });
      }

      default:
        return json({ error: `route inconnue : ${route}` }, 404);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
