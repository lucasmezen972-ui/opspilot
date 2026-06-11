// admin-api — API du back-office superadmin (gestion utilisateurs, orgs,
// abonnements, réglages). Auth manuelle (verify_jwt=false) : chaque requête
// doit porter le JWT d'un profil « superadmin », vérifié via service_role.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, OPTIONS',
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
  if (profile?.role !== 'superadmin') {
    return { error: json({ error: 'Accès réservé au superadmin' }, 403) };
  }
  return { user: data.user };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const gate = await requireSuperadmin(req);
  if ('error' in gate && gate.error) return gate.error;

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
            'id, email, full_name, role, is_active, created_at, organization_id, organizations(name)',
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
        return json({ ok: true, id: uid });
      }

      case 'PATCH /users': {
        const id = parts[1];
        if (!id) return json({ error: 'id manquant' }, 400);
        const body = await req.json();
        const updates: Record<string, unknown> = {};
        for (const k of ['role', 'is_active', 'organization_id', 'full_name']) {
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
        return json({ ok: true });
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
        return json({ ok: true });
      }

      default:
        return json({ error: `route inconnue : ${route}` }, 404);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
