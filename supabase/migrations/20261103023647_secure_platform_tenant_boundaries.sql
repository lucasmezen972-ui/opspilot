-- Tenant administrators never receive platform privileges.
create or replace function public.is_backoffice_operator()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active is true
      and p.role in ('superadmin', 'support'));
$$;
revoke all on function public.is_backoffice_operator() from public, anon;
grant execute on function public.is_backoffice_operator() to authenticated, service_role;
revoke all on function public.superadmin_organizations() from public, anon;
grant execute on function public.superadmin_organizations() to authenticated, service_role;

create or replace function public.superadmin_set_organization_status(p_org_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare v_email text;
begin
  select email::text into v_email from public.profiles
    where id = auth.uid() and role = 'superadmin' and is_active is true;
  if not found then raise exception 'backoffice_forbidden' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('active','suspended','demo') then
    raise exception 'Statut invalide' using errcode = '22023';
  end if;
  update public.organizations set settings = coalesce(settings,'{}'::jsonb)
    || jsonb_build_object('status',p_status), updated_at = now() where id = p_org_id;
  if not found then raise exception 'Organisation introuvable'; end if;
  insert into public.admin_audit_log(actor_id,actor_email,action,target)
    values (auth.uid(),v_email,'organization.set_status',jsonb_build_object('organization_id',p_org_id,'status',p_status));
  return jsonb_build_object('organization_id',p_org_id,'status',p_status);
end;
$$;
revoke all on function public.superadmin_set_organization_status(uuid,text) from public,anon;
grant execute on function public.superadmin_set_organization_status(uuid,text) to authenticated,service_role;

-- Secrets are accessed only by trusted server workers/admin-api.
revoke all on table public.platform_settings from public,anon,authenticated;
grant all on table public.platform_settings to service_role;
drop policy if exists authenticated_read_platform_settings on public.platform_settings;

-- Organisation/role assignment goes through checked RPCs, never a self update.
revoke insert,delete on table public.profiles from public,anon,authenticated;
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_delete_self on public.profiles;
create or replace function public.guard_profile_authorization()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if current_user in ('anon','authenticated') and (
    new.id is distinct from old.id or
    new.organization_id is distinct from old.organization_id or
    new.store_id is distinct from old.store_id or
    new.role is distinct from old.role or
    new.is_active is distinct from old.is_active or
    new.email is distinct from old.email
  ) then raise exception 'Champs de sécurité du profil protégés' using errcode='42501'; end if;
  return new;
end;
$$;
revoke all on function public.guard_profile_authorization() from public,anon,authenticated;
drop trigger if exists guard_profile_authorization on public.profiles;
create trigger guard_profile_authorization before update on public.profiles
  for each row execute function public.guard_profile_authorization();

-- Tenant role management: same organisation, no platform role, no self promotion.
create or replace function public.update_team_member_role(p_member_id uuid,p_role text)
returns public.profiles language plpgsql security definer set search_path=public
as $$
declare actor public.profiles; target public.profiles;
begin
  select * into actor from public.profiles where id=auth.uid() and is_active is true;
  if not found or actor.role not in ('admin','owner','superadmin') then
    raise exception 'Droits insuffisants' using errcode='42501'; end if;
  if p_role is null or p_role not in ('admin','manager','superviseur','employé','employee','stagiaire') then
    raise exception 'Rôle non autorisé' using errcode='42501'; end if;
  select * into target from public.profiles where id=p_member_id and organization_id=actor.organization_id for update;
  if not found or target.role in ('superadmin','support','owner') or p_member_id=actor.id then
    raise exception 'Membre non modifiable' using errcode='42501'; end if;
  update public.profiles set role=p_role,updated_at=now() where id=p_member_id returning * into target;
  return target;
end;
$$;
revoke all on function public.update_team_member_role(uuid,text) from public,anon;
grant execute on function public.update_team_member_role(uuid,text) to authenticated,service_role;

create or replace function public.deactivate_team_member(p_member_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare actor public.profiles;
begin
  select * into actor from public.profiles where id=auth.uid() and is_active is true;
  if not found or actor.role not in ('admin','owner','superadmin','manager') then
    raise exception 'Droits insuffisants' using errcode='42501'; end if;
  update public.profiles set is_active=false,updated_at=now()
    where id=p_member_id and id<>actor.id and organization_id=actor.organization_id
    and role not in ('superadmin','support','owner','admin');
  if not found then raise exception 'Membre non modifiable' using errcode='42501'; end if;
end;
$$;
revoke all on function public.deactivate_team_member(uuid) from public,anon;
grant execute on function public.deactivate_team_member(uuid) to authenticated,service_role;

create or replace function public.guard_organization_authorization()
returns trigger language plpgsql security invoker set search_path=public
as $$
begin
  if current_user in ('anon','authenticated') and (
    new.id is distinct from old.id or new.settings is distinct from old.settings or
    new.subscription_plan is distinct from old.subscription_plan or
    new.max_users is distinct from old.max_users or new.max_stores is distinct from old.max_stores
  ) then raise exception 'Configuration réservée au serveur' using errcode='42501'; end if;
  return new;
end;
$$;
revoke all on function public.guard_organization_authorization() from public,anon,authenticated;
drop trigger if exists guard_organization_authorization on public.organizations;
create trigger guard_organization_authorization before update on public.organizations
  for each row execute function public.guard_organization_authorization();

notify pgrst,'reload schema';
