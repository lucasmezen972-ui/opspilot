// OpsPilot Admin — back-office superadmin.
// SPA sans build : supabase-js chargé en ESM, toutes les opérations
// privilégiées passent par l'Edge Function admin-api (service_role côté
// serveur, jamais dans le navigateur).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://hpqfmuzkkxrqoqoabjmb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcWZtdXpra3hycW9xb2Fiam1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDcyNDgsImV4cCI6MjA5MTAyMzI0OH0.0XeJi3w_XzibExkwp2I1EJjkNCL8eUluf031kzWOaf8';
const API = `${SUPABASE_URL}/functions/v1/admin-api`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (sel) => document.querySelector(sel);
const loginView = $('#login-view');
const appView = $('#app-view');
const content = $('#content');

function toast(msg, ms = 3000) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.hidden = true), ms);
}

function esc(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
}

function downloadCsv(filename, rows) {
  // rows: tableau d'objets homogènes → CSV avec en-têtes, séparateur ;
  if (!rows.length) {
    toast('Rien à exporter.');
    return;
  }
  const headers = Object.keys(rows[0]);
  const escCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(';'),
    ...rows.map((r) => headers.map((h) => escCsv(r[h])).join(';')),
  ].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function api(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Erreur ${res.status}`);
  return body;
}

/* ── Connexion ── */
async function handleLogin() {
  const errEl = $('#login-error');
  errEl.hidden = true;
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  if (!email || !password) {
    errEl.textContent = 'Email et mot de passe requis.';
    errEl.hidden = false;
    return;
  }
  $('#login-submit').disabled = true;
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      throw new Error('Identifiants invalides ou réseau indisponible.');
    await maybeChallenge2fa();
    await enterApp();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.hidden = false;
  } finally {
    $('#login-submit').disabled = false;
  }
}

/**
 * Si un facteur TOTP est enrôlé et que la session est encore aal1,
 * demande le code à 6 chiffres (l'admin-api refuse les sessions aal1
 * dès qu'une 2FA existe : pas de porte dérobée).
 */
async function maybeChallenge2fa() {
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel !== 'aal2' || aal.nextLevel === aal.currentLevel) return;

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (!totp) return;

  const code = prompt('Code 2FA (Google Authenticator) :');
  if (!code) throw new Error('Code 2FA requis.');
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: totp.id,
    code: code.trim(),
  });
  if (error) throw new Error('Code 2FA invalide.');
}

async function setup2fa() {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const existing = factors?.totp?.[0];

  if (existing) {
    openModal(`
      <h3>🔐 2FA activée</h3>
      <p style="margin:10px 0;color:#374151">La double authentification TOTP est active sur ce compte. Un code est demandé à chaque connexion.</p>
      <div class="row-btns">
        <button class="cancel" data-close>Fermer</button>
        <button class="danger" id="mfa-disable">Désactiver la 2FA</button>
      </div>`);
    $('#mfa-disable').addEventListener('click', async () => {
      if (!confirm('Désactiver la double authentification ?')) return;
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: existing.id,
      });
      if (error) {
        toast(`Erreur : ${error.message}`, 5000);
        return;
      }
      closeModal();
      toast('2FA désactivée.');
    });
    return;
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'OpsPilot Admin',
  });
  if (error) {
    toast(`Erreur : ${error.message}`, 5000);
    return;
  }
  openModal(`
    <h3>🔐 Activer la 2FA</h3>
    <p style="margin:10px 0;color:#374151">1. Scanne ce QR code avec Google Authenticator (ou équivalent) :</p>
    <div style="text-align:center;background:#fff;padding:8px">${data.totp.qr_code}</div>
    <p style="margin:10px 0;color:#6b7280;font-size:12px">Ou saisis la clé : <code>${esc(data.totp.secret)}</code></p>
    <label>2. Entre le code à 6 chiffres affiché</label>
    <input id="mfa-code" inputmode="numeric" placeholder="123456" />
    <div class="row-btns">
      <button class="cancel" id="mfa-cancel">Annuler</button>
      <button id="mfa-verify">Activer</button>
    </div>`);
  $('#mfa-cancel').addEventListener('click', async () => {
    await supabase.auth.mfa.unenroll({ factorId: data.id });
    closeModal();
  });
  $('#mfa-verify').addEventListener('click', async () => {
    const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId: data.id,
      code: $('#mfa-code').value.trim(),
    });
    if (vErr) {
      toast('Code invalide, réessaie.', 4000);
      return;
    }
    closeModal();
    toast('2FA activée ✅ Elle sera demandée à chaque connexion.');
  });
}

async function enterApp() {
  // Vérifie le rôle superadmin avant d'afficher quoi que ce soit.
  try {
    await api('/stats');
  } catch (e) {
    await supabase.auth.signOut();
    throw new Error(
      e.message.includes('superadmin')
        ? 'Ce compte n’est pas superadmin.'
        : e.message,
    );
  }
  const { data } = await supabase.auth.getUser();
  $('#me-email').textContent = data?.user?.email ?? '';
  loginView.hidden = true;
  appView.hidden = false;
  navigate();
}

/* ── Router ── */
const views = {
  dashboard: renderDashboard,
  users: renderUsers,
  orgs: renderOrgs,
  announcements: renderAnnouncements,
  settings: renderSettings,
  billing: renderBilling,
  health: renderHealth,
  platform: renderPlatform,
  journal: renderJournal,
};

function navigate() {
  const view = (location.hash.replace('#/', '') || 'dashboard').split('?')[0];
  document.querySelectorAll('.sidebar nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.view === view);
  });
  (views[view] ?? renderDashboard)().catch((e) => {
    content.innerHTML = `<h2>Erreur</h2><p class="subtitle">${esc(e.message)}</p>`;
  });
}

/* ── Vues ── */
async function renderDashboard() {
  content.innerHTML =
    '<h2>Tableau de bord</h2><p class="subtitle">Chargement…</p>';
  const [s, d] = await Promise.all([api('/stats'), api('/dashboard')]);
  const subs = s.subscriptions ?? {};

  const alertHtml = d.expiring_trials.length
    ? `<div class="alert-box">⚠️ <strong>${d.expiring_trials.length} essai(s)</strong> expirent dans les 7 jours :
        ${d.expiring_trials
          .map(
            (t) =>
              `<span class="badge amber" style="margin:2px">${esc(t.organizations?.name ?? t.organization_id)} — ${new Date(t.trial_ends_at).toLocaleDateString('fr-FR')}</span>`,
          )
          .join(' ')}
        <a href="#/orgs" style="margin-left:6px">Gérer →</a></div>`
    : '';

  content.innerHTML = `
    <h2>Tableau de bord</h2>
    <p class="subtitle">Vue d'ensemble de la plateforme</p>
    ${alertHtml}
    <div class="cards">
      <div class="card"><div class="num">${s.organizations}</div><div class="label">Organisations</div></div>
      <div class="card"><div class="num">${s.users}</div><div class="label">Utilisateurs</div></div>
      <div class="card"><div class="num">${subs.active ?? 0}</div><div class="label">Abonnements actifs</div></div>
      <div class="card"><div class="num">${subs.trialing ?? 0}</div><div class="label">En essai</div></div>
      <div class="card"><div class="num">${d.trends.audits_7d}</div><div class="label">Audits — 7 jours</div></div>
      <div class="card"><div class="num">${d.trends.audits_30d}</div><div class="label">Audits — 30 jours</div></div>
      <div class="card"><div class="num">${d.trends.new_users_30d}</div><div class="label">Nouveaux comptes — 30 j</div></div>
      <div class="card"><div class="num">${s.audits}</div><div class="label">Audits au total</div></div>
    </div>
    <div class="two-cols">
      <div>
        <h3 class="col-title">Dernières inscriptions</h3>
        <table><tbody>
          ${
            d.recent_users
              .map(
                (u) => `<tr>
            <td><strong>${esc(u.full_name ?? u.email)}</strong><br /><span style="color:#6b7280">${esc(u.organizations?.name ?? '—')}</span></td>
            <td style="text-align:right;color:#6b7280">${new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
          </tr>`,
              )
              .join('') || '<tr><td><em>Aucune inscription.</em></td></tr>'
          }
        </tbody></table>
      </div>
      <div>
        <h3 class="col-title">Derniers audits</h3>
        <table><tbody>
          ${
            d.recent_audits
              .map(
                (a) => `<tr>
            <td><strong>${esc(a.title)}</strong><br /><span style="color:#6b7280">${esc(a.organizations?.name ?? '—')}</span></td>
            <td style="text-align:right"><span class="badge ${a.status === 'completed' ? 'green' : 'gray'}">${esc(a.status)}</span></td>
          </tr>`,
              )
              .join('') || '<tr><td><em>Aucun audit.</em></td></tr>'
          }
        </tbody></table>
      </div>
    </div>`;
}

const ROLE_LABELS = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  manager: 'Manager',
  employé: 'Employé',
  employee: 'Employé',
  stagiaire: 'Stagiaire',
};
const SUB_BADGES = {
  active: 'green',
  trialing: 'amber',
  past_due: 'red',
  canceled: 'gray',
  cancelled: 'gray',
};

async function renderUsers() {
  content.innerHTML =
    '<h2>Utilisateurs</h2><p class="subtitle">Chargement…</p>';
  const [{ users }, { organizations }] = await Promise.all([
    api('/users'),
    api('/organizations'),
  ]);
  const rows = users
    .map(
      (u) => `
    <tr data-email="${esc((u.email ?? '').toLowerCase())}">
      <td><strong>${esc(u.full_name ?? '—')}</strong><br /><span style="color:#6b7280">${esc(u.email)}</span></td>
      <td>${esc(u.organizations?.name ?? '—')}</td>
      <td><span class="badge ${u.role === 'superadmin' ? 'red' : u.role === 'admin' ? 'amber' : 'gray'}">${esc(ROLE_LABELS[u.role] ?? u.role)}</span></td>
      <td>${u.is_active === false ? '<span class="badge red">Désactivé</span>' : '<span class="badge green">Actif</span>'}<br />
        <span style="color:#9ca3af;font-size:11px">vu : ${u.last_active ? new Date(u.last_active).toLocaleDateString('fr-FR') : 'jamais'}</span></td>
      <td style="white-space:nowrap">${
        u.role === 'superadmin'
          ? ''
          : `<button class="small" data-edit-user="${u.id}">Modifier</button>
             <button class="small" data-reset-user="${u.id}" title="Réinitialiser le mot de passe">🔑</button>
             <button class="small danger" data-delete-user="${u.id}" title="Supprimer">🗑</button>
             <button class="small" data-impersonate="${u.id}" title="Se connecter en tant que">🕵️</button>`
      }</td>
    </tr>`,
    )
    .join('');
  content.innerHTML = `
    <h2>Utilisateurs</h2>
    <p class="subtitle">${users.length} compte(s)</p>
    <div class="toolbar">
      <input id="user-search" placeholder="Rechercher par email…" />
      <div>
        <button class="small" id="user-export">📥 Export CSV</button>
        <button class="small" id="user-create">+ Créer un utilisateur</button>
      </div>
    </div>
    <table>
      <thead><tr><th>Utilisateur</th><th>Organisation</th><th>Rôle</th><th>Statut</th><th></th></tr></thead>
      <tbody id="users-body">${rows}</tbody>
    </table>`;

  $('#user-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#users-body tr').forEach((tr) => {
      tr.hidden = q !== '' && !tr.dataset.email.includes(q);
    });
  });
  $('#user-create').addEventListener('click', () =>
    userForm(null, organizations),
  );
  document.querySelectorAll('[data-edit-user]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = users.find((x) => x.id === btn.dataset.editUser);
      userForm(u, organizations);
    });
  });
  document.querySelectorAll('[data-reset-user]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const u = users.find((x) => x.id === btn.dataset.resetUser);
      if (!confirm(`Réinitialiser le mot de passe de ${u.email} ?`)) return;
      try {
        const { password } = await api(`/reset-password/${u.id}`, {
          method: 'POST',
        });
        openModal(`
          <h3>Mot de passe réinitialisé</h3>
          <p style="margin:10px 0;color:#374151">Nouveau mot de passe provisoire de <strong>${esc(u.email)}</strong> — copie-le maintenant, il ne sera plus affiché :</p>
          <input readonly value="${esc(password)}" onclick="this.select()" style="font-family:monospace" />
          <div class="row-btns"><button data-close>Fermer</button></div>`);
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
  $('#user-export').addEventListener('click', () => {
    downloadCsv(
      'opspilot-utilisateurs.csv',
      users.map((u) => ({
        email: u.email,
        nom: u.full_name ?? '',
        organisation: u.organizations?.name ?? '',
        role: ROLE_LABELS[u.role] ?? u.role,
        actif: u.is_active === false ? 'non' : 'oui',
        cree_le: u.created_at?.slice(0, 10) ?? '',
      })),
    );
  });
  document.querySelectorAll('[data-impersonate]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const u = users.find((x) => x.id === btn.dataset.impersonate);
      if (
        !confirm(
          `Générer un lien de connexion au compte de ${u.email} ?\nL'action sera tracée dans le journal.`,
        )
      )
        return;
      try {
        const { link } = await api(`/impersonate/${u.id}`, { method: 'POST' });
        openModal(`
          <h3>🕵️ Connexion en tant que ${esc(u.email)}</h3>
          <p style="margin:10px 0;color:#374151">⚠️ Ouvre ce lien dans une <strong>fenêtre privée</strong> (sinon il remplacera ta session superadmin). Valable une seule fois, expire rapidement.</p>
          <input readonly value="${esc(link)}" onclick="this.select()" style="font-size:12px" />
          <div class="row-btns">
            <button class="cancel" data-close>Fermer</button>
            <button id="imp-copy">Copier le lien</button>
          </div>`);
        $('#imp-copy').addEventListener('click', () => {
          navigator.clipboard.writeText(link);
          toast('Lien copié ✅');
        });
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
  document.querySelectorAll('[data-delete-user]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const u = users.find((x) => x.id === btn.dataset.deleteUser);
      if (
        !confirm(
          `Supprimer définitivement le compte ${u.email} ? Cette action est irréversible.`,
        )
      )
        return;
      try {
        await api(`/users/${u.id}`, { method: 'DELETE' });
        toast('Utilisateur supprimé ✅');
        renderUsers();
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
}

function userForm(user, organizations) {
  const isNew = !user;
  const orgOptions = organizations
    .map(
      (o) =>
        `<option value="${o.id}" ${user?.organization_id === o.id ? 'selected' : ''}>${esc(o.name)}</option>`,
    )
    .join('');
  openModal(`
    <h3>${isNew ? 'Créer un utilisateur' : 'Modifier ' + esc(user.email)}</h3>
    <label>Nom complet</label>
    <input id="f-name" value="${esc(user?.full_name ?? '')}" placeholder="Prénom Nom" />
    ${
      isNew
        ? `<label>Email</label><input id="f-email" type="email" placeholder="email@exemple.com" />
    <label>Mot de passe provisoire</label><input id="f-password" type="text" placeholder="min. 8 caractères" />`
        : ''
    }
    <label>Organisation</label>
    <select id="f-org"><option value="">— Aucune —</option>${orgOptions}</select>
    <label>Magasin</label>
    <select id="f-store"><option value="">— Aucun —</option></select>
    <label>Rôle</label>
    <select id="f-role">
      ${['admin', 'manager', 'employé', 'stagiaire']
        .map(
          (r) =>
            `<option value="${r}" ${user?.role === r ? 'selected' : ''}>${ROLE_LABELS[r]}</option>`,
        )
        .join('')}
    </select>
    ${
      !isNew
        ? `<label>Statut</label>
    <select id="f-active">
      <option value="true" ${user.is_active !== false ? 'selected' : ''}>Actif</option>
      <option value="false" ${user.is_active === false ? 'selected' : ''}>Désactivé</option>
    </select>`
        : ''
    }
    <div class="row-btns">
      <button class="cancel" data-close>Annuler</button>
      <button id="f-save">${isNew ? 'Créer' : 'Enregistrer'}</button>
    </div>`);

  const loadStores = async () => {
    const orgId = $('#f-org').value;
    const sel = $('#f-store');
    sel.innerHTML = '<option value="">— Aucun —</option>';
    if (!orgId) return;
    try {
      const { stores } = await api(`/stores/${orgId}`);
      for (const st of stores) {
        const opt = document.createElement('option');
        opt.value = st.id;
        opt.textContent = st.name + (st.city ? ` (${st.city})` : '');
        if (user?.store_id === st.id) opt.selected = true;
        sel.appendChild(opt);
      }
    } catch {
      /* pas bloquant */
    }
  };
  $('#f-org').addEventListener('change', loadStores);
  loadStores();

  $('#f-save').addEventListener('click', async () => {
    try {
      if (isNew) {
        await api('/users', {
          method: 'POST',
          body: JSON.stringify({
            email: $('#f-email').value.trim(),
            password: $('#f-password').value,
            full_name: $('#f-name').value.trim() || null,
            role: $('#f-role').value,
            organization_id: $('#f-org').value || null,
            store_id: $('#f-store').value || null,
          }),
        });
        toast('Utilisateur créé ✅');
      } else {
        await api(`/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            full_name: $('#f-name').value.trim() || null,
            role: $('#f-role').value,
            organization_id: $('#f-org').value || null,
            store_id: $('#f-store').value || null,
            is_active: $('#f-active').value === 'true',
          }),
        });
        toast('Utilisateur mis à jour ✅');
      }
      closeModal();
      renderUsers();
    } catch (e) {
      toast(`Erreur : ${e.message}`, 5000);
    }
  });
}

async function renderOrgs() {
  content.innerHTML =
    '<h2>Organisations &amp; abonnés</h2><p class="subtitle">Chargement…</p>';
  const { organizations } = await api('/organizations');
  const rows = organizations
    .map((o) => {
      const sub = Array.isArray(o.subscriptions)
        ? o.subscriptions[0]
        : o.subscriptions;
      const status = sub?.status ?? 'aucun';
      const badge = SUB_BADGES[status] ?? 'gray';
      const trial = sub?.trial_ends_at
        ? new Date(sub.trial_ends_at).toLocaleDateString('fr-FR')
        : '—';
      const userCount = o.profiles?.[0]?.count ?? 0;
      return `
    <tr>
      <td><strong>${esc(o.name)}</strong><br /><span style="color:#6b7280">${userCount} utilisateur(s)</span></td>
      <td><span class="badge ${badge}">${esc(status)}</span><br /><span style="color:#6b7280">plan : ${esc(sub?.plan ?? '—')}</span></td>
      <td>${trial}</td>
      <td style="white-space:nowrap">
        <button class="small" data-extend="${o.id}">+30 j d'essai</button>
        <select class="small-select" data-status="${o.id}">
          ${['trialing', 'active', 'past_due', 'canceled']
            .map(
              (st) =>
                `<option value="${st}" ${status === st ? 'selected' : ''}>${st}</option>`,
            )
            .join('')}
        </select>
        <button class="small" data-rename="${o.id}" title="Renommer">✏️</button>
        <button class="small" data-detail="${o.id}">Détails</button>
        <button class="small" data-export-org="${o.id}" title="Export RGPD (JSON)">📤</button>
        <button class="small danger" data-delete-org="${o.id}" data-org-name="${esc(o.name)}" title="Supprimer définitivement">🗑</button>
        ${sub?.stripe_customer_id ? `<a href="https://dashboard.stripe.com/customers/${esc(sub.stripe_customer_id)}" target="_blank" rel="noopener">Stripe ↗</a>` : ''}
      </td>
    </tr>
    <tr hidden data-detail-row="${o.id}"><td colspan="4"></td></tr>`;
    })
    .join('');
  content.innerHTML = `
    <h2>Organisations &amp; abonnés</h2>
    <div class="toolbar">
      <p class="subtitle" style="margin:0">${organizations.length} organisation(s)</p>
      <div>
        <button class="small" id="org-export">📥 Export CSV</button>
        <button class="small" id="org-create">+ Créer une organisation</button>
      </div>
    </div>
    <table>
      <thead><tr><th>Organisation</th><th>Abonnement</th><th>Fin d'essai</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  document.querySelectorAll('[data-extend]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm("Prolonger la période d'essai de 30 jours ?")) return;
      try {
        await api(`/subscriptions/${btn.dataset.extend}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'trialing',
            trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          }),
        });
        toast('Essai prolongé de 30 jours ✅');
        renderOrgs();
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
  document.querySelectorAll('[data-status]').forEach((sel) => {
    sel.addEventListener('change', async () => {
      try {
        await api(`/subscriptions/${sel.dataset.status}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: sel.value }),
        });
        toast(`Statut → ${sel.value} ✅`);
        renderOrgs();
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
  document.querySelectorAll('[data-rename]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const o = organizations.find((x) => x.id === btn.dataset.rename);
      const name = prompt("Nouveau nom de l'organisation :", o.name);
      if (!name?.trim() || name.trim() === o.name) return;
      try {
        await api(`/organizations/${o.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: name.trim() }),
        });
        toast('Organisation renommée ✅');
        renderOrgs();
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
  document.querySelectorAll('[data-detail]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const row = document.querySelector(
        `[data-detail-row="${btn.dataset.detail}"]`,
      );
      if (!row.hidden) {
        row.hidden = true;
        return;
      }
      row.hidden = false;
      row.firstElementChild.innerHTML = 'Chargement…';
      try {
        const orgId = btn.dataset.detail;
        const [d, { stores }, { activity }] = await Promise.all([
          api(`/organization-detail/${orgId}`),
          api(`/stores/${orgId}`),
          api(`/organization-activity/${orgId}`),
        ]);
        const counts = Object.values(activity ?? {});
        const max = Math.max(1, ...counts);
        const points = counts
          .map(
            (v, i) =>
              `${((i / Math.max(1, counts.length - 1)) * 200).toFixed(1)},${(30 - (v / max) * 28).toFixed(1)}`,
          )
          .join(' ');
        const spark = `<svg width="200" height="32" style="vertical-align:middle"><polyline points="${points}" fill="none" stroke="#2563eb" stroke-width="2" /></svg> <span style="color:#6b7280;font-size:12px">audits / jour (30 j)</span>`;
        row.firstElementChild.innerHTML = `
          ${spark}<br />
          <strong>${d.counts.audits}</strong> audits ·
          <strong>${d.counts.actions}</strong> actions ·
          <strong>${d.counts.products}</strong> produits<br />
          ${
            d.members
              .map(
                (m) =>
                  `<span class="badge gray" style="margin:2px">${esc(m.full_name ?? m.email)} (${esc(ROLE_LABELS[m.role] ?? m.role)})</span>`,
              )
              .join(' ') || '<em>Aucun membre</em>'
          }
          <div style="margin-top:10px">
            🏬 <strong>Magasins :</strong>
            ${
              stores
                .map(
                  (st) =>
                    `<span class="badge ${st.is_active === false ? 'red' : 'gray'}" style="margin:2px">${esc(st.name)}${st.city ? ' — ' + esc(st.city) : ''}</span>
                     <button class="small" data-store-rename="${st.id}" data-store-name="${esc(st.name)}">✏️</button>`,
                )
                .join(' ') || '<em>aucun</em>'
            }
            <button class="small" data-store-add="${orgId}">+ Magasin</button>
          </div>`;
        const refresh = () => {
          btn.click();
          btn.click();
        };
        row.querySelectorAll('[data-store-rename]').forEach((b) => {
          b.addEventListener('click', async () => {
            const name = prompt(
              'Nouveau nom du magasin :',
              b.dataset.storeName,
            );
            if (!name?.trim()) return;
            try {
              await api(`/stores/${b.dataset.storeRename}`, {
                method: 'PATCH',
                body: JSON.stringify({ name: name.trim() }),
              });
              toast('Magasin renommé ✅');
              refresh();
            } catch (e) {
              toast(`Erreur : ${e.message}`, 5000);
            }
          });
        });
        row
          .querySelector('[data-store-add]')
          .addEventListener('click', async () => {
            const name = prompt('Nom du nouveau magasin :');
            if (!name?.trim()) return;
            const city = prompt('Ville (optionnel) :') ?? '';
            try {
              await api('/stores', {
                method: 'POST',
                body: JSON.stringify({ organization_id: orgId, name, city }),
              });
              toast('Magasin créé ✅');
              refresh();
            } catch (e) {
              toast(`Erreur : ${e.message}`, 5000);
            }
          });
      } catch (e) {
        row.firstElementChild.textContent = `Erreur : ${e.message}`;
      }
    });
  });
  $('#org-export').addEventListener('click', () => {
    downloadCsv(
      'opspilot-organisations.csv',
      organizations.map((o) => {
        const sub = Array.isArray(o.subscriptions)
          ? o.subscriptions[0]
          : o.subscriptions;
        return {
          nom: o.name,
          statut: sub?.status ?? 'aucun',
          plan: sub?.plan ?? '',
          fin_essai: sub?.trial_ends_at?.slice(0, 10) ?? '',
          utilisateurs: o.profiles?.[0]?.count ?? 0,
          cree_le: o.created_at?.slice(0, 10) ?? '',
        };
      }),
    );
  });
  document.querySelectorAll('[data-export-org]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        toast('Export en cours…');
        const data = await api(`/export-organization/${btn.dataset.exportOrg}`);
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `opspilot-export-${btn.dataset.exportOrg}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Export RGPD téléchargé ✅');
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
  document.querySelectorAll('[data-delete-org]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.orgName;
      const typed = prompt(
        `⚠️ SUPPRESSION DÉFINITIVE de « ${name} » et de TOUTES ses données (membres, audits, produits…).\n\nPour confirmer, recopie exactement le nom de l'organisation :`,
      );
      if (typed === null) return;
      if (typed !== name) {
        toast('Nom incorrect — suppression annulée.', 4000);
        return;
      }
      try {
        await api(
          `/organizations/${btn.dataset.deleteOrg}?confirm=${encodeURIComponent(typed)}`,
          { method: 'DELETE' },
        );
        toast('Organisation supprimée.');
        renderOrgs();
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
  $('#org-create').addEventListener('click', () => {
    openModal(`
      <h3>Créer une organisation</h3>
      <label>Nom de l'organisation</label>
      <input id="o-name" placeholder="Ma société" />
      <label>Premier magasin (optionnel)</label>
      <input id="o-store" placeholder="Magasin principal" />
      <p style="font-size:12px;color:#6b7280;margin-top:8px">Un abonnement d'essai de 14 jours est créé automatiquement.</p>
      <div class="row-btns">
        <button class="cancel" data-close>Annuler</button>
        <button id="o-save">Créer</button>
      </div>`);
    $('#o-save').addEventListener('click', async () => {
      try {
        await api('/organizations', {
          method: 'POST',
          body: JSON.stringify({
            name: $('#o-name').value,
            store_name: $('#o-store').value,
          }),
        });
        toast('Organisation créée ✅');
        closeModal();
        renderOrgs();
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
}

const ACTION_LABELS = {
  'user.create': '👤 Utilisateur créé',
  'user.update': '✏️ Utilisateur modifié',
  'user.delete': '🗑 Utilisateur supprimé',
  'user.reset_password': '🔑 Mot de passe réinitialisé',
  'organization.create': '🏢 Organisation créée',
  'organization.rename': '🏢 Organisation renommée',
  'subscription.update': '💳 Abonnement modifié',
  'settings.update': '⚙️ Réglage modifié',
  'user.impersonate': '🕵️ Connexion en tant que',
  'store.create': '🏬 Magasin créé',
  'store.update': '🏬 Magasin modifié',
  'announcement.create': '📢 Annonce publiée',
  'announcement.toggle': '📢 Annonce (dés)activée',
  'organization.export': '⚖️ Export RGPD',
  'organization.delete': '⚖️ Organisation supprimée',
  'platform.update': '🛠 Réglage plateforme',
};

async function renderAnnouncements() {
  content.innerHTML = '<h2>Annonces</h2><p class="subtitle">Chargement…</p>';
  const [{ announcements }, { organizations }] = await Promise.all([
    api('/announcements'),
    api('/organizations'),
  ]);
  const rows = announcements
    .map(
      (a) => `
    <tr>
      <td><strong>${esc(a.title)}</strong>${a.body ? `<br /><span style="color:#6b7280">${esc(a.body)}</span>` : ''}</td>
      <td><span class="badge ${a.level === 'warning' ? 'amber' : a.level === 'success' ? 'green' : 'gray'}">${esc(a.level)}</span></td>
      <td>${esc(a.organizations?.name ?? 'Toutes')}</td>
      <td>${a.ends_at ? new Date(a.ends_at).toLocaleDateString('fr-FR') : '∞'}</td>
      <td>${a.is_active ? '<span class="badge green">Active</span>' : '<span class="badge gray">Inactive</span>'}</td>
      <td><button class="small" data-toggle-ann="${a.id}" data-active="${a.is_active}">${a.is_active ? 'Désactiver' : 'Réactiver'}</button></td>
    </tr>`,
    )
    .join('');
  const orgOptions = organizations
    .map((o) => `<option value="${o.id}">${esc(o.name)}</option>`)
    .join('');
  content.innerHTML = `
    <h2>Annonces</h2>
    <p class="subtitle">Bannières affichées dans l'app (globales ou par organisation)</p>
    <div class="toolbar"><span></span><button class="small" id="ann-create">+ Publier une annonce</button></div>
    <table>
      <thead><tr><th>Annonce</th><th>Niveau</th><th>Cible</th><th>Expire</th><th>État</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6"><em>Aucune annonce.</em></td></tr>'}</tbody>
    </table>`;
  document.querySelectorAll('[data-toggle-ann]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api(`/announcements/${btn.dataset.toggleAnn}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_active: btn.dataset.active !== 'true' }),
        });
        toast('Annonce mise à jour ✅');
        renderAnnouncements();
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
  $('#ann-create').addEventListener('click', () => {
    openModal(`
      <h3>📢 Publier une annonce</h3>
      <label>Titre</label>
      <input id="a-title" placeholder="Maintenance dimanche 9h" />
      <label>Message (optionnel)</label>
      <input id="a-body" placeholder="Détail affiché sous le titre" />
      <label>Niveau</label>
      <select id="a-level">
        <option value="info">Info (bleu)</option>
        <option value="warning">Avertissement (orange)</option>
        <option value="success">Bonne nouvelle (vert)</option>
      </select>
      <label>Cible</label>
      <select id="a-org"><option value="">Toutes les organisations</option>${orgOptions}</select>
      <label>Expire dans (jours, vide = jamais)</label>
      <input id="a-days" inputmode="numeric" placeholder="7" />
      <div class="row-btns">
        <button class="cancel" data-close>Annuler</button>
        <button id="a-save">Publier</button>
      </div>`);
    $('#a-save').addEventListener('click', async () => {
      const days = parseInt($('#a-days').value, 10);
      try {
        await api('/announcements', {
          method: 'POST',
          body: JSON.stringify({
            title: $('#a-title').value,
            body: $('#a-body').value,
            level: $('#a-level').value,
            organization_id: $('#a-org').value || null,
            ends_at: Number.isFinite(days)
              ? new Date(Date.now() + days * 86400000).toISOString()
              : null,
          }),
        });
        toast('Annonce publiée ✅');
        closeModal();
        renderAnnouncements();
      } catch (e) {
        toast(`Erreur : ${e.message}`, 5000);
      }
    });
  });
}

async function renderBilling() {
  content.innerHTML = '<h2>Facturation</h2><p class="subtitle">Chargement…</p>';
  const b = await api('/billing-overview');
  if (!b.configured) {
    content.innerHTML = `
      <h2>Facturation</h2>
      <p class="subtitle">La clé STRIPE_SECRET_KEY n'est pas configurée côté serveur — les chiffres Stripe apparaîtront ici dès qu'elle le sera.</p>`;
    return;
  }
  const rows = (b.invoices ?? [])
    .map(
      (i) => `
    <tr>
      <td>${esc(i.number ?? '—')}</td>
      <td>${esc(i.customer_email ?? '—')}</td>
      <td>${(i.amount ?? 0).toFixed(2)} ${esc((i.currency ?? '').toUpperCase())}</td>
      <td><span class="badge ${i.status === 'paid' ? 'green' : i.status === 'open' ? 'amber' : 'gray'}">${esc(i.status)}</span></td>
      <td>${i.created ? new Date(i.created * 1000).toLocaleDateString('fr-FR') : ''}</td>
    </tr>`,
    )
    .join('');
  content.innerHTML = `
    <h2>Facturation</h2>
    <p class="subtitle">Données Stripe en direct</p>
    <div class="cards">
      <div class="card"><div class="num">${b.mrr.toFixed(2)} €</div><div class="label">MRR (revenu mensuel récurrent)</div></div>
      <div class="card"><div class="num">${b.active_subscriptions}</div><div class="label">Abonnements Stripe actifs</div></div>
    </div>
    <h3 class="col-title">Dernières factures</h3>
    <table>
      <thead><tr><th>N°</th><th>Client</th><th>Montant</th><th>Statut</th><th>Date</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5"><em>Aucune facture.</em></td></tr>'}</tbody>
    </table>`;
}

async function renderHealth() {
  content.innerHTML = '<h2>Santé</h2><p class="subtitle">Chargement…</p>';
  const h = await api('/health');
  const cronRows = (h.cron ?? [])
    .map(
      (c) => `
    <tr>
      <td>${esc(c.jobname)}</td>
      <td><span class="badge ${c.status === 'succeeded' ? 'green' : 'red'}">${esc(c.status)}</span></td>
      <td style="color:#6b7280">${esc(c.return_message ?? '')}</td>
      <td>${c.end_time ? new Date(c.end_time).toLocaleString('fr-FR') : ''}</td>
    </tr>`,
    )
    .join('');
  const emailRows = (h.emails ?? [])
    .map(
      (e) => `
    <tr>
      <td>${esc(e.recipient)}</td>
      <td>${esc(e.template)}</td>
      <td><span class="badge ${e.status === 'sent' ? 'green' : e.status === 'skipped' ? 'amber' : 'red'}">${esc(e.status)}</span>${e.error ? `<br /><span style="color:#9ca3af;font-size:11px">${esc(e.error.slice(0, 80))}</span>` : ''}</td>
      <td>${new Date(e.created_at).toLocaleString('fr-FR')}</td>
    </tr>`,
    )
    .join('');
  content.innerHTML = `
    <h2>Santé</h2>
    <p class="subtitle">Tâches planifiées, emails et base de données</p>
    <div class="cards">
      <div class="card"><div class="num">${esc(h.db_size ?? '—')}</div><div class="label">Taille de la base</div></div>
      <div class="card"><div class="num">${h.audit_log_count}</div><div class="label">Actions au journal</div></div>
    </div>
    <h3 class="col-title">Tâches planifiées (3 derniers runs)</h3>
    <table>
      <thead><tr><th>Tâche</th><th>Statut</th><th>Message</th><th>Fin</th></tr></thead>
      <tbody>${cronRows || '<tr><td colspan="4"><em>Aucun run.</em></td></tr>'}</tbody>
    </table>
    <h3 class="col-title" style="margin-top:18px">Relances email (20 dernières)</h3>
    <table>
      <thead><tr><th>Destinataire</th><th>Modèle</th><th>Statut</th><th>Date</th></tr></thead>
      <tbody>${emailRows || '<tr><td colspan="4"><em>Aucun email — la première relance partira automatiquement quand un essai approchera de sa fin.</em></td></tr>'}</tbody>
    </table>`;
}

async function renderPlatform() {
  content.innerHTML = '<h2>Plateforme</h2><p class="subtitle">Chargement…</p>';
  const { settings } = await api('/platform-settings');
  const defaults = settings.find((x) => x.key === 'defaults')?.value ?? {};
  content.innerHTML = `
    <h2>Plateforme</h2>
    <p class="subtitle">Réglages globaux appliqués aux nouvelles organisations</p>
    <div class="card" style="max-width:420px">
      <label>Durée d'essai par défaut (jours)</label>
      <input id="pf-trial" inputmode="numeric" value="${esc(defaults.trial_days ?? 14)}" />
      <button id="pf-save" style="margin-top:14px">Enregistrer</button>
    </div>
    <p class="subtitle" style="margin-top:14px">📧 Relances automatiques : actives (cron quotidien 08:00 UTC). Les envois réels démarrent dès que la clé RESEND_API_KEY est posée en secret Supabase — d'ici là, chaque relance est journalisée en « skipped » (visible dans Santé).</p>`;
  $('#pf-save').addEventListener('click', async () => {
    const days = parseInt($('#pf-trial').value, 10);
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      toast('Durée invalide (1-365 jours).', 4000);
      return;
    }
    try {
      await api('/platform-settings', {
        method: 'PUT',
        body: JSON.stringify({ key: 'defaults', value: { trial_days: days } }),
      });
      toast('Réglages enregistrés ✅');
    } catch (e) {
      toast(`Erreur : ${e.message}`, 5000);
    }
  });
}

async function renderJournal() {
  content.innerHTML = '<h2>Journal</h2><p class="subtitle">Chargement…</p>';
  const { log } = await api('/audit-log');
  const rows = log
    .map(
      (l) => `
    <tr>
      <td>${new Date(l.created_at).toLocaleString('fr-FR')}</td>
      <td>${esc(ACTION_LABELS[l.action] ?? l.action)}</td>
      <td style="font-family:monospace;font-size:12px;color:#6b7280">${esc(
        JSON.stringify(l.target),
      )}</td>
      <td>${esc(l.actor_email ?? '—')}</td>
    </tr>`,
    )
    .join('');
  content.innerHTML = `
    <h2>Journal</h2>
    <p class="subtitle">Les 100 dernières actions du back-office</p>
    <table>
      <thead><tr><th>Date</th><th>Action</th><th>Détail</th><th>Par</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4"><em>Aucune action enregistrée.</em></td></tr>'}</tbody>
    </table>`;
}

// Notifications email configurables par organisation (clé app_settings,
// désactivées par défaut, avec liste de destinataires).
const NOTIFY_SETTINGS = [
  {
    key: 'notify.audit_completed',
    label: 'Audit terminé',
    hint: "Email envoyé à chaque clôture d'audit",
  },
  {
    key: 'notify.training_completed',
    label: 'Formation terminée',
    hint: 'Email envoyé à chaque formation validée',
  },
];

// Réglages proposés par défaut pour chaque organisation.
const KNOWN_SETTINGS = [
  { key: 'features.reports', label: 'Module Rapports activé' },
  { key: 'features.training', label: 'Module Formation activé' },
  { key: 'features.ai_assistant', label: 'Assistant IA activé' },
  { key: 'audits.auto_actions', label: 'Actions correctives automatiques' },
];

async function renderSettings() {
  content.innerHTML = '<h2>Paramètres</h2><p class="subtitle">Chargement…</p>';
  const { organizations } = await api('/organizations');
  if (organizations.length === 0) {
    content.innerHTML =
      '<h2>Paramètres</h2><p class="subtitle">Aucune organisation.</p>';
    return;
  }
  const options = organizations
    .map((o) => `<option value="${o.id}">${esc(o.name)}</option>`)
    .join('');
  content.innerHTML = `
    <h2>Paramètres</h2>
    <p class="subtitle">Réglages d'application par organisation (sans coder)</p>
    <div class="toolbar"><select id="settings-org" style="max-width:320px">${options}</select></div>
    <div id="settings-list"></div>`;
  const loadFor = async (orgId) => {
    const list = $('#settings-list');
    list.innerHTML = '<p class="subtitle">Chargement…</p>';
    const { settings } = await api(`/settings/${orgId}`);
    const current = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const notifyRows = NOTIFY_SETTINGS.map((n) => {
      const val = current[n.key] ?? {};
      const enabled = val.enabled === true;
      const recipients = Array.isArray(val.recipients)
        ? val.recipients.join(', ')
        : '';
      return `<tr>
        <td>${n.label}<br /><span style="color:#9ca3af;font-size:12px">${n.hint}</span></td>
        <td><input data-notify-emails="${n.key}" value="${esc(recipients)}" placeholder="manager@magasin.fr, directeur@..." style="min-width:240px" /></td>
        <td>${enabled ? '<span class="badge green">Actif</span>' : '<span class="badge gray">Inactif</span>'}</td>
        <td><button class="small" data-notify-save="${n.key}">Enregistrer</button>
            <button class="small" data-notify-toggle="${n.key}" data-enabled="${enabled}">${enabled ? 'Désactiver' : 'Activer'}</button></td>
      </tr>`;
    }).join('');
    list.innerHTML = `<table><thead><tr><th>Réglage</th><th>État</th><th></th></tr></thead><tbody>${KNOWN_SETTINGS.map(
      (k) => {
        const enabled = current[k.key]?.enabled !== false; // activé par défaut
        return `<tr><td>${k.label}<br /><span style="color:#9ca3af;font-size:12px">${k.key}</span></td>
        <td>${enabled ? '<span class="badge green">Activé</span>' : '<span class="badge red">Désactivé</span>'}</td>
        <td><button class="small" data-toggle="${k.key}" data-enabled="${enabled}">${enabled ? 'Désactiver' : 'Activer'}</button></td></tr>`;
      },
    ).join('')}</tbody></table>
    <h3 class="col-title" style="margin-top:22px">📧 Notifications par email</h3>
    <p class="subtitle">Prévenez le manager ou le directeur commercial à chaque audit ou formation terminé. Saisissez un ou plusieurs emails (séparés par des virgules) puis activez.</p>
    <table><thead><tr><th>Événement</th><th>Destinataires</th><th>État</th><th></th></tr></thead><tbody>${notifyRows}</tbody></table>`;

    const parseEmails = (raw) =>
      raw
        .split(/[,;\s]+/)
        .map((e) => e.trim())
        .filter((e) => /.+@.+\..+/.test(e));

    list.querySelectorAll('[data-notify-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.notifySave;
        const emails = parseEmails(
          list.querySelector(`[data-notify-emails="${key}"]`).value,
        );
        const wasEnabled = current[key]?.enabled === true;
        try {
          await api(`/settings/${orgId}`, {
            method: 'PUT',
            body: JSON.stringify({
              key,
              value: { enabled: wasEnabled, recipients: emails },
            }),
          });
          toast(`Destinataires enregistrés (${emails.length}) ✅`);
          loadFor(orgId);
        } catch (e) {
          toast(`Erreur : ${e.message}`, 5000);
        }
      });
    });
    list.querySelectorAll('[data-notify-toggle]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.notifyToggle;
        const emails = parseEmails(
          list.querySelector(`[data-notify-emails="${key}"]`).value,
        );
        const enable = btn.dataset.enabled !== 'true';
        if (enable && emails.length === 0) {
          toast("Ajoutez au moins un email valide avant d'activer.", 4000);
          return;
        }
        try {
          await api(`/settings/${orgId}`, {
            method: 'PUT',
            body: JSON.stringify({
              key,
              value: { enabled: enable, recipients: emails },
            }),
          });
          toast(enable ? 'Notification activée ✅' : 'Notification désactivée');
          loadFor(orgId);
        } catch (e) {
          toast(`Erreur : ${e.message}`, 5000);
        }
      });
    });
    list.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api(`/settings/${orgId}`, {
            method: 'PUT',
            body: JSON.stringify({
              key: btn.dataset.toggle,
              value: { enabled: btn.dataset.enabled !== 'true' },
            }),
          });
          toast('Réglage mis à jour ✅');
          loadFor(orgId);
        } catch (e) {
          toast(`Erreur : ${e.message}`, 5000);
        }
      });
    });
  };
  $('#settings-org').addEventListener('change', (e) => loadFor(e.target.value));
  await loadFor(organizations[0].id);
}

/* ── Modal ── */
function openModal(html) {
  closeModal();
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.id = 'modal';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener('click', (e) => {
    if (e.target === bg || e.target.hasAttribute('data-close')) closeModal();
  });
  document.body.appendChild(bg);
}
function closeModal() {
  document.getElementById('modal')?.remove();
}

/* ── Boot ── */
$('#login-submit').addEventListener('click', handleLogin);
$('#login-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});
const THEME_KEY = 'opspilot_admin_theme';
function applyTheme() {
  document.body.classList.toggle(
    'dark',
    localStorage.getItem(THEME_KEY) === 'dark',
  );
}
$('#theme-toggle').addEventListener('click', () => {
  localStorage.setItem(
    THEME_KEY,
    document.body.classList.contains('dark') ? 'light' : 'dark',
  );
  applyTheme();
});
applyTheme();

$('#setup-2fa').addEventListener('click', setup2fa);

$('#change-password').addEventListener('click', () => {
  openModal(`
    <h3>Changer mon mot de passe</h3>
    <label>Nouveau mot de passe (min. 8 caractères)</label>
    <input id="pw-new" type="password" autocomplete="new-password" />
    <label>Confirmer</label>
    <input id="pw-confirm" type="password" autocomplete="new-password" />
    <div class="row-btns">
      <button class="cancel" data-close>Annuler</button>
      <button id="pw-save">Changer</button>
    </div>`);
  $('#pw-save').addEventListener('click', async () => {
    const pw = $('#pw-new').value;
    if (pw.length < 8) {
      toast('8 caractères minimum.', 4000);
      return;
    }
    if (pw !== $('#pw-confirm').value) {
      toast('Les deux saisies ne correspondent pas.', 4000);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      toast(`Erreur : ${error.message}`, 5000);
      return;
    }
    closeModal();
    toast('Mot de passe changé ✅');
  });
});

$('#logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.reload();
});
window.addEventListener('hashchange', navigate);

const { data } = await supabase.auth.getSession();
if (data?.session) {
  enterApp().catch((e) => {
    $('#login-error').textContent = e.message;
    $('#login-error').hidden = false;
  });
}
