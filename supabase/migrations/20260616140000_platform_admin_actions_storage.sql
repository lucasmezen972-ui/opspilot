-- Finalisation « SaaS pilotable » :
--   1. Persistance de la configuration d'onboarding (secteur + modules).
--   2. Action superadmin : suspendre / réactiver une organisation cliente.
--   3. Bucket de stockage des preuves (photos), cloisonné par organisation.
--
-- S'appuie sur l'existant : is_backoffice_operator() (rôles superadmin/owner/
-- admin/support), current_org_id() et le statut stocké dans organizations.settings
-- ->> 'status' (lu par superadmin_organizations()). Aucune colonne ajoutée.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Onboarding : enregistre secteur + modules dans les réglages de l'org.
--    SECURITY DEFINER + fusion jsonb (préserve les autres clés, ex. status).
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.apply_onboarding_configuration(
  p_sector text default null,
  p_modules jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_role text;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = 'P0001';
  end if;

  select organization_id, role into v_org, v_role
  from public.profiles
  where id = v_uid;

  if v_org is null then
    raise exception 'Aucune organisation rattachée' using errcode = 'P0001';
  end if;
  if v_role not in ('superadmin', 'owner', 'admin', 'manager') then
    raise exception 'Droits insuffisants' using errcode = '42501';
  end if;

  update public.organizations
  set settings = coalesce(settings, '{}'::jsonb)
                 || jsonb_strip_nulls(jsonb_build_object('sector', p_sector))
                 || jsonb_build_object(
                      'modules', coalesce(p_modules, '[]'::jsonb),
                      'onboarded', true
                    ),
      updated_at = now()
  where id = v_org;

  return jsonb_build_object(
    'organization_id', v_org,
    'sector', p_sector,
    'modules', coalesce(p_modules, '[]'::jsonb)
  );
end;
$$;

comment on function public.apply_onboarding_configuration(text, jsonb) is
  'Persiste secteur + modules choisis à l''onboarding dans organizations.settings.';

revoke execute on function public.apply_onboarding_configuration(text, jsonb)
  from public, anon;
grant execute on function public.apply_onboarding_configuration(text, jsonb)
  to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) Action superadmin : changer le statut d'une organisation (active /
--    suspended / demo). Tracée dans admin_audit_log.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.superadmin_set_organization_status(
  p_org_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if not public.is_backoffice_operator() then
    raise exception 'backoffice_forbidden' using errcode = '42501';
  end if;
  if p_status not in ('active', 'suspended', 'demo') then
    raise exception 'Statut invalide (active|suspended|demo)' using errcode = 'P0001';
  end if;

  update public.organizations
  set settings = coalesce(settings, '{}'::jsonb)
                 || jsonb_build_object('status', p_status),
      updated_at = now()
  where id = p_org_id;

  if not found then
    raise exception 'Organisation introuvable' using errcode = 'P0001';
  end if;

  select email::text into v_email from public.profiles where id = v_uid;

  insert into public.admin_audit_log(actor_id, actor_email, action, target)
  values (
    v_uid,
    v_email,
    'organization.set_status',
    jsonb_build_object('organization_id', p_org_id, 'status', p_status)
  );

  return jsonb_build_object('organization_id', p_org_id, 'status', p_status);
end;
$$;

comment on function public.superadmin_set_organization_status(uuid, text) is
  'Suspend ou réactive une organisation cliente (back-office superadmin).';

revoke execute on function public.superadmin_set_organization_status(uuid, text)
  from public, anon;
grant execute on function public.superadmin_set_organization_status(uuid, text)
  to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 3) Bucket privé « evidence » + policies cloisonnées par organisation.
--    Convention de chemin : <organization_id>/<entity_type>/<entity_id>/<file>
--    => le 1er segment porte l'organisation (storage.foldername(name)[1]).
-- ───────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'evidence_org_read'
  ) then
    create policy "evidence_org_read" on storage.objects
      for select to authenticated
      using (
        bucket_id = 'evidence'
        and (storage.foldername(name))[1] = public.current_org_id()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'evidence_org_insert'
  ) then
    create policy "evidence_org_insert" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'evidence'
        and (storage.foldername(name))[1] = public.current_org_id()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'evidence_org_update'
  ) then
    create policy "evidence_org_update" on storage.objects
      for update to authenticated
      using (
        bucket_id = 'evidence'
        and (storage.foldername(name))[1] = public.current_org_id()::text
      )
      with check (
        bucket_id = 'evidence'
        and (storage.foldername(name))[1] = public.current_org_id()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'evidence_org_delete'
  ) then
    create policy "evidence_org_delete" on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'evidence'
        and (storage.foldername(name))[1] = public.current_org_id()::text
      );
  end if;
end $$;
