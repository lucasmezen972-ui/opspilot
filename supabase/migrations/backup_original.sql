/*
OPS-PILOT — SCHEMA COMPLET (RLS managers OK)
--------------------------------------------
- Extensions
- Drop & Create tables
- Contraintes & index
- Trigger updated_at
- RLS multi-tenant (incl. managers user_sessions)
- Seed minimal (sans insert dans auth.users)
*/

-- =========================================
-- 0) EXTENSIONS
-- =========================================
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

-- =========================================
-- 1) NETTOYAGE (ordre inverse des deps)
-- =========================================
drop table if exists public.reports               cascade;
drop table if exists public.user_sessions         cascade;
drop table if exists public.user_badges           cascade;
drop table if exists public.badges                cascade;
drop table if exists public.notifications         cascade;
drop table if exists public.messages              cascade;
drop table if exists public.conversations         cascade;
drop table if exists public.user_training_progress cascade;
drop table if exists public.trainings             cascade;
drop table if exists public.products              cascade;
drop table if exists public.tasks                 cascade;
drop table if exists public.audit_photos          cascade;
drop table if exists public.audit_responses       cascade;
drop table if exists public.audits                cascade;
drop table if exists public.audit_items           cascade;
drop table if exists public.audit_templates       cascade;
drop table if exists public.profiles              cascade;
drop table if exists public.departments           cascade;
drop table if exists public.stores                cascade;
drop table if exists public.organizations         cascade;
drop table if exists public.users                 cascade;

-- =========================================
-- 2) TABLES
-- =========================================

-- 👥 USERS
create table if not exists public.users (
  id uuid primary key,
  email citext not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 🏢 ORGANIZATIONS
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  settings jsonb default '{}'::jsonb,
  subscription_plan text default 'pro' check (subscription_plan in ('basic','pro','enterprise')),
  max_users integer default 100,
  max_stores integer default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 🏪 STORES
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  city text,
  postal_code text,
  country text default 'France',
  latitude numeric(10,8),
  longitude numeric(11,8),
  manager_id uuid, -- -> profiles.id (optionnel)
  settings jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 🏬 DEPARTMENTS
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  name text not null,
  description text,
  manager_id uuid, -- -> profiles.id (optionnel)
  created_at timestamptz default now()
);

-- 👤 PROFILES
create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  email citext not null,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'employé' check (role in ('admin','manager','employé','stagiaire')),
  department_id uuid references public.departments(id) on delete set null,
  level integer default 1,
  xp integer default 0,
  total_audits integer default 0,
  avg_score integer default 0,
  completed_trainings integer default 0,
  active_time_hours integer default 0,
  last_active timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 📋 AUDIT TEMPLATES
create table if not exists public.audit_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  category text,
  estimated_duration integer,
  max_score integer default 100,
  is_active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 📝 AUDIT ITEMS
create table if not exists public.audit_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.audit_templates(id) on delete cascade,
  question text not null,
  item_type text default 'checkbox' check (item_type in ('checkbox','rating','text','photo','numeric')),
  is_required boolean default false,
  points integer default 10,
  sort_order integer default 0,
  options jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 🔍 AUDITS
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  template_id uuid references public.audit_templates(id) on delete set null,
  auditor_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  location text,
  status text default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  score integer,
  max_score integer default 100,
  issues_count integer default 0,
  photos text[] default '{}',
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 💬 AUDIT RESPONSES
create table if not exists public.audit_responses (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  item_id uuid not null references public.audit_items(id) on delete cascade,
  response_value text,
  score integer default 0,
  notes text,
  photos text[] default '{}',
  created_at timestamptz default now(),
  unique (audit_id, item_id)
);

-- 📸 AUDIT PHOTOS
create table if not exists public.audit_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_id uuid not null references public.audits(id) on delete cascade,
  image_url text not null,
  comment text,
  file_size integer,
  annotations jsonb default '[]'::jsonb,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ✅ TASKS
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  location text,
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  status text default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  estimated_time_minutes integer,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 📦 PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  barcode text,
  name text not null,
  category text,
  price numeric(10,2),
  stock_quantity integer default 0,
  min_stock integer default 5,
  dlc date,
  image_url text,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 🎓 TRAININGS
create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  content text,
  category text,
  difficulty text default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  duration_minutes integer,
  xp_reward integer default 50,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 📈 USER TRAINING PROGRESS
create table if not exists public.user_training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  training_id uuid not null references public.trainings(id) on delete cascade,
  status text default 'not_started' check (status in ('not_started','in_progress','completed')),
  progress_percentage integer default 0,
  score integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, training_id)
);

-- 💬 CONVERSATIONS
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  type text default 'group' check (type in ('group','direct','support')),
  participants uuid[] default '{}',
  last_message_at timestamptz default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 💌 MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  message_type text default 'text' check (message_type in ('text','image','file','system')),
  attachments jsonb default '[]'::jsonb,
  read_by uuid[] default '{}',
  replied_to uuid references public.messages(id) on delete set null,
  created_at timestamptz default now()
);

-- 🔔 NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text,
  notification_type text default 'info' check (notification_type in ('info','warning','error','success')),
  action_url text,
  data jsonb default '{}'::jsonb,
  is_read boolean default false,
  is_push_sent boolean default false,
  created_at timestamptz default now()
);

-- 🏆 BADGES
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  requirements jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 👤 USER_BADGES
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  awarded_at timestamptz default now(),
  unique (user_id, badge_id)
);

-- 📊 USER SESSIONS
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  session_start timestamptz default now(),
  session_end timestamptz,
  duration_minutes integer,
  actions_count integer default 0,
  created_at timestamptz default now()
);

-- 📋 REPORTS
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  generated_by uuid references public.profiles(id) on delete set null,
  report_type text not null check (report_type in ('audit_summary','performance','compliance','analytics')),
  title text not null,
  data jsonb default '{}'::jsonb,
  file_url text,
  date_from date,
  date_to date,
  created_at timestamptz default now()
);

-- =========================================
-- 3) CONTRAINTES MÉTIER
-- =========================================
alter table public.products
  add constraint chk_products_price_nonneg  check (price is null or price >= 0),
  add constraint chk_products_stock_nonneg  check (stock_quantity >= 0 and min_stock >= 0);

alter table public.user_training_progress
  add constraint chk_utp_pct check (progress_percentage between 0 and 100);

alter table public.audit_items
  add constraint chk_ai_points_nonneg check (points >= 0);

alter table public.audits
  add constraint chk_audits_score_bounds check (score is null or (score >= 0 and score <= max_score));

-- =========================================
-- 4) INDEXES & RECHERCHE
-- =========================================
create unique index if not exists uq_users_email            on public.users(email);
create unique index if not exists uq_profiles_id            on public.profiles(id);
create unique index if not exists uq_products_org_name      on public.products (organization_id, lower(name));
create unique index if not exists uq_departments_store_name on public.departments (store_id, lower(name));

create index if not exists idx_profiles_email        on public.profiles(email);
create index if not exists idx_profiles_organization on public.profiles(organization_id);
create index if not exists idx_profiles_store        on public.profiles(store_id);

create index if not exists idx_audits_organization   on public.audits(organization_id);
create index if not exists idx_audits_auditor        on public.audits(auditor_id);
create index if not exists idx_audits_status         on public.audits(status);
create index if not exists idx_audits_created_at     on public.audits(created_at);

create index if not exists idx_audit_items_template  on public.audit_items(template_id);
create index if not exists idx_audit_responses_audit on public.audit_responses(audit_id);
create index if not exists idx_audit_responses_item  on public.audit_responses(item_id);

create index if not exists idx_tasks_organization    on public.tasks(organization_id);
create index if not exists idx_tasks_assigned_to     on public.tasks(assigned_to);
create index if not exists idx_tasks_status          on public.tasks(status);
create index if not exists idx_tasks_priority        on public.tasks(priority);
create index if not exists idx_tasks_store           on public.tasks(store_id);

create index if not exists idx_products_organization on public.products(organization_id);
create index if not exists idx_products_name         on public.products(name);
create index if not exists idx_products_barcode      on public.products(barcode);

create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_sender       on public.messages(sender_id);
create index if not exists idx_messages_created_at   on public.messages(created_at);

create index if not exists idx_notifications_user    on public.notifications(user_id);
create index if not exists idx_notifications_read    on public.notifications(is_read);
create index if not exists idx_notifications_created on public.notifications(created_at);

create index if not exists idx_conversations_org     on public.conversations(organization_id);
create index if not exists idx_utp_user              on public.user_training_progress(user_id);
create index if not exists idx_utp_training          on public.user_training_progress(training_id);
create index if not exists idx_reports_org_store     on public.reports (organization_id, store_id);

-- JSONB / recherche
create index if not exists gin_stores_settings    on public.stores using gin (settings);
create index if not exists gin_messages_attach    on public.messages using gin (attachments);
create index if not exists gin_reports_data       on public.reports using gin (data);
create index if not exists gin_products_name_trgm on public.products using gin (name gin_trgm_ops);

-- =========================================
-- 5) TRIGGER updated_at
-- =========================================
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

do $$
declare r record;
begin
  for r in
    select table_name
    from information_schema.columns
    where table_schema='public' and column_name='updated_at'
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', r.table_name);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.tg_set_updated_at();', r.table_name);
  end loop;
end$$;

-- =========================================
-- 6) RLS SÉCURISÉE (incl. managers pour user_sessions)
-- =========================================

-- Activer RLS
alter table public.organizations          enable row level security;
alter table public.stores                 enable row level security;
alter table public.departments            enable row level security;
alter table public.profiles               enable row level security;
alter table public.audit_templates        enable row level security;
alter table public.audit_items            enable row level security;
alter table public.audits                 enable row level security;
alter table public.audit_responses        enable row level security;
alter table public.audit_photos           enable row level security;
alter table public.tasks                  enable row level security;
alter table public.products               enable row level security;
alter table public.trainings              enable row level security;
alter table public.user_training_progress enable row level security;
alter table public.conversations          enable row level security;
alter table public.messages               enable row level security;
alter table public.notifications          enable row level security;
alter table public.badges                 enable row level security;
alter table public.user_badges            enable row level security;
alter table public.user_sessions          enable row level security;
alter table public.reports                enable row level security;

-- Drop toutes policies existantes
do $$
declare r record;
begin
  for r in
    select polname, relname
    from pg_policy p
    join pg_class c on p.polrelid = c.oid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I;', r.polname, r.relname);
  end loop;
end$$;

-- Vue helper : profil courant
create or replace view public.v_current_profile as
select p.*
from public.profiles p
where p.id = auth.uid();

-- Policies génériques pour tables AVEC organization_id (exclut 'organizations','profiles','user_sessions')
do $$
declare
  t text;
  tbls text[] := array[
    'stores','departments','audit_templates','audits','audit_photos',
    'tasks','products','trainings','conversations','notifications','reports'
  ];
begin
  foreach t in array tbls loop
    execute format($f$
      create policy org_select_%1$I on public.%1$I for select
      using (organization_id = (select organization_id from public.v_current_profile limit 1));
    $f$, t);

    execute format($f$
      create policy org_insert_%1$I on public.%1$I for insert
      with check (organization_id = (select organization_id from public.v_current_profile limit 1));
    $f$, t);

    execute format($f$
      create policy org_update_%1$I on public.%1$I for update
      using (organization_id = (select organization_id from public.v_current_profile limit 1))
      with check (organization_id = (select organization_id from public.v_current_profile limit 1));
    $f$, t);

    execute format($f$
      create policy org_delete_%1$I on public.%1$I for delete
      using (organization_id = (select organization_id from public.v_current_profile limit 1));
    $f$, t);
  end loop;
end$$;

-- organizations : jointure via id
create policy org_select_organizations on public.organizations
for select
using (exists (
  select 1 from public.v_current_profile cp
  where cp.organization_id = organizations.id
));
create policy org_all_organizations on public.organizations
for all
using (exists (
  select 1 from public.v_current_profile cp
  where cp.organization_id = organizations.id
))
with check (exists (
  select 1 from public.v_current_profile cp
  where cp.organization_id = organizations.id
));

-- audit_items via audit_templates
create policy org_read_audit_items on public.audit_items for select
using (exists (
  select 1
  from public.audit_templates t
  join public.v_current_profile cp on cp.organization_id = t.organization_id
  where t.id = audit_items.template_id
));
create policy org_cud_audit_items on public.audit_items for all
using (exists (
  select 1
  from public.audit_templates t
  join public.v_current_profile cp on cp.organization_id = t.organization_id
  where t.id = audit_items.template_id
))
with check (exists (
  select 1
  from public.audit_templates t
  join public.v_current_profile cp on cp.organization_id = t.organization_id
  where t.id = audit_items.template_id
));

-- audit_responses via audits
create policy org_all_audit_responses on public.audit_responses for all
using (exists (
  select 1
  from public.audits a
  join public.v_current_profile cp on cp.organization_id = a.organization_id
  where a.id = audit_responses.audit_id
))
with check (exists (
  select 1
  from public.audits a
  join public.v_current_profile cp on cp.organization_id = a.organization_id
  where a.id = audit_responses.audit_id
));

-- messages via conversations
create policy org_all_messages on public.messages for all
using (exists (
  select 1
  from public.conversations c
  join public.v_current_profile cp on cp.organization_id = c.organization_id
  where c.id = messages.conversation_id
))
with check (exists (
  select 1
  from public.conversations c
  join public.v_current_profile cp on cp.organization_id = c.organization_id
  where c.id = messages.conversation_id
));

-- badges globaux & user_badges self
create policy badges_read_all on public.badges for select using (true);
create policy user_badges_self on public.user_badges for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- PROFILES : lecture par org ; écriture self
create policy profiles_select_org on public.profiles
for select
using (organization_id = (select organization_id from public.v_current_profile limit 1));

create policy profiles_insert_self on public.profiles
for insert
with check (id = auth.uid());

create policy profiles_update_self on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy profiles_delete_self on public.profiles
for delete
using (id = auth.uid());

-- ===== user_sessions : droits self + manager (même store) + admin (org) =====
-- Helpers de condition
-- Admin org-wide
create or replace view public.v_is_admin as
select exists (
  select 1 from public.v_current_profile cp where cp.role = 'admin'
) as ok;

-- Manager (même store)
create or replace view public.v_is_manager as
select exists (
  select 1 from public.v_current_profile cp where cp.role = 'manager'
) as ok;

-- SELECT : self OR (admin même org) OR (manager même store dans la même org)
create policy us_select on public.user_sessions
for select
using (
  -- self
  user_id = auth.uid()
  -- admin org-wide
  or ( (select ok from public.v_is_admin) and exists (
        select 1 from public.profiles p
        where p.id = user_sessions.user_id
          and p.organization_id = (select organization_id from public.v_current_profile limit 1)
      ))
  -- manager même store
  or ( (select ok from public.v_is_manager) and exists (
        select 1 from public.profiles p
        join public.v_current_profile cp on true
        where p.id = user_sessions.user_id
          and p.organization_id = cp.organization_id
          and p.store_id = cp.store_id
      ))
);

-- INSERT : self OR admin org OR manager même store
create policy us_insert on public.user_sessions
for insert
with check (
  user_id = auth.uid()
  or ( (select ok from public.v_is_admin) and exists (
        select 1 from public.profiles p
        where p.id = user_sessions.user_id
          and p.organization_id = (select organization_id from public.v_current_profile limit 1)
      ))
  or ( (select ok from public.v_is_manager) and exists (
        select 1 from public.profiles p
        join public.v_current_profile cp on true
        where p.id = user_sessions.user_id
          and p.organization_id = cp.organization_id
          and p.store_id = cp.store_id
      ))
);

-- UPDATE : mêmes règles que insert
create policy us_update on public.user_sessions
for update
using (
  user_id = auth.uid()
  or ( (select ok from public.v_is_admin) and exists (
        select 1 from public.profiles p
        where p.id = user_sessions.user_id
          and p.organization_id = (select organization_id from public.v_current_profile limit 1)
      ))
  or ( (select ok from public.v_is_manager) and exists (
        select 1 from public.profiles p
        join public.v_current_profile cp on true
        where p.id = user_sessions.user_id
          and p.organization_id = cp.organization_id
          and p.store_id = cp.store_id
      ))
)
with check (
  user_id = auth.uid()
  or ( (select ok from public.v_is_admin) and exists (
        select 1 from public.profiles p
        where p.id = user_sessions.user_id
          and p.organization_id = (select organization_id from public.v_current_profile limit 1)
      ))
  or ( (select ok from public.v_is_manager) and exists (
        select 1 from public.profiles p
        join public.v_current_profile cp on true
        where p.id = user_sessions.user_id
          and p.organization_id = cp.organization_id
          and p.store_id = cp.store_id
      ))
);

-- DELETE : mêmes règles que update
create policy us_delete on public.user_sessions
for delete
using (
  user_id = auth.uid()
  or ( (select ok from public.v_is_admin) and exists (
        select 1 from public.profiles p
        where p.id = user_sessions.user_id
          and p.organization_id = (select organization_id from public.v_current_profile limit 1)
      ))
  or ( (select ok from public.v_is_manager) and exists (
        select 1 from public.profiles p
        join public.v_current_profile cp on true
        where p.id = user_sessions.user_id
          and p.organization_id = cp.organization_id
          and p.store_id = cp.store_id
      ))
);

-- =========================================
-- 7) SEED MINIMAL (sans auth.users)
-- =========================================

-- Utilisateur logique (remplacez UUID par celui créé dans Auth)
insert into public.users (id, email)
values ('550e8400-e29b-41d4-a716-446655440100', 'demo@opspilot.com')
on conflict (id) do nothing;

-- Organisation & magasins
insert into public.organizations (id, name, subscription_plan, max_users, max_stores)
values ('550e8400-e29b-41d4-a716-446655440000','Supermarché Central','enterprise',200,25)
on conflict (id) do nothing;

insert into public.stores (id, organization_id, name, address, city, postal_code, country)
values
('550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440000','Supermarché Central - Paris 15ème','123 Avenue de la République','Paris','75015','France'),
('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440000','Supermarché Central - Versailles','45 Rue des Écoles','Versailles','78000','France')
on conflict (id) do nothing;

insert into public.departments (id, organization_id, store_id, name, description)
values
('550e8400-e29b-41d4-a716-446655440010','550e8400-e29b-41d4-a716-446655440000','550e8400-e29b-41d4-a716-446655440001','Rayon Frais','Produits laitiers, charcuterie, fromages'),
('550e8400-e29b-41d4-a716-446655440011','550e8400-e29b-41d4-a716-446655440000','550e8400-e29b-41d4-a716-446655440002','Épicerie','Sec et conserves')
on conflict (id) do nothing;

-- Profil démo (IMPORTANT : même UUID que l’utilisateur Auth)
insert into public.profiles (id, organization_id, store_id, email, full_name, role, level)
values ('550e8400-e29b-41d4-a716-446655440100','550e8400-e29b-41d4-a716-446655440000','550e8400-e29b-41d4-a716-446655440001','demo@opspilot.com','Utilisateur Démo','manager',3)
on conflict (id) do nothing;

-- Template & items d’audit de démonstration
insert into public.audit_templates (id, organization_id, name, category, estimated_duration, created_by)
values ('550e8400-e29b-41d4-a716-446655440030','550e8400-e29b-41d4-a716-446655440000','Sécurité Alimentaire','Qualité',30,'550e8400-e29b-41d4-a716-446655440100')
on conflict (id) do nothing;

insert into public.audit_items (id, template_id, question, item_type, points, sort_order)
values
('550e8400-e29b-41d4-a716-446655440031','550e8400-e29b-41d4-a716-446655440030','Températures respectées ?', 'checkbox',10,1),
('550e8400-e29b-41d4-a716-446655440032','550e8400-e29b-41d4-a716-446655440030','Propreté du plan de travail', 'rating',20,2)
on conflict (id) do nothing;

-- Fin seed minimal