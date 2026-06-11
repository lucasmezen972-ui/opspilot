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
    await enterApp();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.hidden = false;
  } finally {
    $('#login-submit').disabled = false;
  }
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
  settings: renderSettings,
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
  const s = await api('/stats');
  const subs = s.subscriptions ?? {};
  content.innerHTML = `
    <h2>Tableau de bord</h2>
    <p class="subtitle">Vue d'ensemble de la plateforme</p>
    <div class="cards">
      <div class="card"><div class="num">${s.organizations}</div><div class="label">Organisations</div></div>
      <div class="card"><div class="num">${s.users}</div><div class="label">Utilisateurs</div></div>
      <div class="card"><div class="num">${s.audits}</div><div class="label">Audits créés</div></div>
      <div class="card"><div class="num">${subs.active ?? 0}</div><div class="label">Abonnements actifs</div></div>
      <div class="card"><div class="num">${subs.trialing ?? 0}</div><div class="label">En période d'essai</div></div>
    </div>
    <p class="subtitle">Utilise le menu à gauche pour gérer les utilisateurs, les organisations et les réglages.</p>`;
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
      <td>${u.is_active === false ? '<span class="badge red">Désactivé</span>' : '<span class="badge green">Actif</span>'}</td>
      <td style="white-space:nowrap">${
        u.role === 'superadmin'
          ? ''
          : `<button class="small" data-edit-user="${u.id}">Modifier</button>
             <button class="small" data-reset-user="${u.id}" title="Réinitialiser le mot de passe">🔑</button>
             <button class="small danger" data-delete-user="${u.id}" title="Supprimer">🗑</button>`
      }</td>
    </tr>`,
    )
    .join('');
  content.innerHTML = `
    <h2>Utilisateurs</h2>
    <p class="subtitle">${users.length} compte(s)</p>
    <div class="toolbar">
      <input id="user-search" placeholder="Rechercher par email…" />
      <button class="small" id="user-create">+ Créer un utilisateur</button>
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
      <button class="small" id="org-create">+ Créer une organisation</button>
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
        const d = await api(`/organization-detail/${btn.dataset.detail}`);
        row.firstElementChild.innerHTML = `
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
          }`;
      } catch (e) {
        row.firstElementChild.textContent = `Erreur : ${e.message}`;
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
};

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
    list.innerHTML = `<table><thead><tr><th>Réglage</th><th>État</th><th></th></tr></thead><tbody>${KNOWN_SETTINGS.map(
      (k) => {
        const enabled = current[k.key]?.enabled !== false; // activé par défaut
        return `<tr><td>${k.label}<br /><span style="color:#9ca3af;font-size:12px">${k.key}</span></td>
        <td>${enabled ? '<span class="badge green">Activé</span>' : '<span class="badge red">Désactivé</span>'}</td>
        <td><button class="small" data-toggle="${k.key}" data-enabled="${enabled}">${enabled ? 'Désactiver' : 'Activer'}</button></td></tr>`;
      },
    ).join('')}</tbody></table>`;
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
