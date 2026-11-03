-- Account provisioning cannot move an existing employee or restart a free trial.
create or replace function public.create_organization(org_name text,store_name text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.profiles; uid uuid:=auth.uid(); email_address text; org uuid; store uuid;
begin
 if uid is null then raise exception 'Non authentifié' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('onboarding:'||uid::text,0));
 select * into actor from public.profiles where id=uid for update;
 if found then
  if actor.is_active is not true or (actor.organization_id is not null and not public.has_active_profile()) then raise exception 'Compte indisponible' using errcode='42501'; end if;
  if actor.organization_id is not null then return jsonb_build_object('organization_id',actor.organization_id,'store_id',actor.store_id,'role',actor.role); end if;
 end if;
 if nullif(trim(org_name),'') is null or length(org_name)>160 or length(store_name)>160 then raise exception 'Nom d’organisation ou de magasin invalide'; end if;
 select email::text into email_address from auth.users where id=uid;
 if email_address is null then raise exception 'Compte introuvable' using errcode='42501'; end if;
 insert into public.users(id,email) values(uid,email_address) on conflict(id) do nothing;
 insert into public.organizations(name) values(trim(org_name)) returning id into org;
 if nullif(trim(store_name),'') is not null then insert into public.stores(organization_id,name) values(org,trim(store_name)) returning id into store; end if;
 insert into public.profiles(id,email,organization_id,store_id,role) values(uid,email_address,org,store,'admin')
 on conflict(id) do update set organization_id=excluded.organization_id,store_id=excluded.store_id,role=excluded.role;
 insert into public.subscriptions(organization_id,plan,status,trial_ends_at) values(org,'trial','trialing',now()+interval '14 days') on conflict(organization_id) do nothing;
 return jsonb_build_object('organization_id',org,'store_id',store,'role','admin');
end $$;
revoke all on function public.create_organization(text,text) from public,anon;
grant execute on function public.create_organization(text,text) to authenticated;

create or replace function public.accept_invitation(invite_token uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.profiles; invitation public.invitations; uid uuid:=auth.uid(); email_address text;
begin
 if uid is null then raise exception 'Non authentifié' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('onboarding:'||uid::text,0));
 select * into actor from public.profiles where id=uid for update;
 if found and (actor.is_active is not true or (actor.organization_id is not null and not public.has_active_profile())) then raise exception 'Compte indisponible' using errcode='42501'; end if;
 select email::text into email_address from auth.users where id=uid;
 select * into invitation from public.invitations where token=invite_token for update;
 if invitation.id is null or email_address is null or lower(invitation.email)<>lower(email_address) then raise exception 'Invitation inaccessible' using errcode='42501'; end if;
 if actor.organization_id is not null then
  if invitation.status='accepted' and actor.organization_id=invitation.organization_id then return jsonb_build_object('organization_id',actor.organization_id,'store_id',actor.store_id,'role',actor.role); end if;
  raise exception 'Ce compte appartient déjà à une organisation' using errcode='42501';
 end if;
 if invitation.status<>'pending' or invitation.expires_at<=now() then raise exception 'Invitation expirée ou déjà utilisée'; end if;
 if invitation.role is null or invitation.role not in ('admin','manager','employé','employee','stagiaire') then raise exception 'Rôle non autorisé' using errcode='42501'; end if;
 if not exists(select 1 from public.organizations where id=invitation.organization_id and coalesce(settings->>'status','active')<>'suspended') or
  (invitation.store_id is not null and not exists(select 1 from public.stores where id=invitation.store_id and organization_id=invitation.organization_id)) then raise exception 'Organisation ou magasin indisponible' using errcode='42501'; end if;
 insert into public.users(id,email) values(uid,email_address) on conflict(id) do nothing;
 insert into public.profiles(id,email,organization_id,store_id,role) values(uid,email_address,invitation.organization_id,invitation.store_id,invitation.role)
 on conflict(id) do update set organization_id=excluded.organization_id,store_id=excluded.store_id,role=excluded.role;
 update public.invitations set status='accepted' where id=invitation.id;
 return jsonb_build_object('organization_id',invitation.organization_id,'store_id',invitation.store_id,'role',invitation.role);
end $$;
revoke all on function public.accept_invitation(uuid) from public,anon;
grant execute on function public.accept_invitation(uuid) to authenticated;

create or replace function public.apply_onboarding_configuration(p_sector text default null,p_modules jsonb default '[]')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.profiles;
begin
 select * into actor from public.profiles where id=auth.uid();
 if not public.has_active_profile() or actor.role not in ('superadmin','owner','admin','manager') or actor.organization_id is null then raise exception 'Droits insuffisants' using errcode='42501'; end if;
 if length(p_sector)>160 or jsonb_typeof(p_modules) is distinct from 'array' or jsonb_array_length(p_modules)>40 then raise exception 'Configuration invalide'; end if;
 update public.organizations set settings=coalesce(settings,'{}')||jsonb_strip_nulls(jsonb_build_object('sector',p_sector))||jsonb_build_object('modules',p_modules,'onboarded',true),updated_at=now() where id=actor.organization_id;
 return jsonb_build_object('organization_id',actor.organization_id,'sector',p_sector,'modules',p_modules);
end $$;
revoke all on function public.apply_onboarding_configuration(text,jsonb) from public,anon;
grant execute on function public.apply_onboarding_configuration(text,jsonb) to authenticated;

create or replace function public.update_team_member_role(p_member_id uuid,p_role text)
returns public.profiles language plpgsql security definer set search_path=public
as $$
declare actor public.profiles; target public.profiles;
begin
  if not public.has_active_profile() then raise exception 'Compte indisponible' using errcode='42501'; end if;
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

create or replace function public.deactivate_team_member(p_member_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare actor public.profiles;
begin
  if not public.has_active_profile() then raise exception 'Compte indisponible' using errcode='42501'; end if;
  select * into actor from public.profiles where id=auth.uid() and is_active is true;
  if not found or actor.role not in ('admin','owner','superadmin','manager') then
    raise exception 'Droits insuffisants' using errcode='42501'; end if;
  update public.profiles set is_active=false,updated_at=now()
    where id=p_member_id and id<>actor.id and organization_id=actor.organization_id
    and role not in ('superadmin','support','owner','admin');
  if not found then raise exception 'Membre non modifiable' using errcode='42501'; end if;
end;
$$;

create or replace function public.request_qonto_billing(p_plan text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare actor public.profiles; result public.billing_requests;
begin
  if not public.has_active_profile() then raise exception 'Compte indisponible' using errcode='42501'; end if;
  select * into actor from public.profiles where id=auth.uid() and is_active is true;
  if not found or actor.organization_id is null or actor.role not in ('admin','owner','superadmin') then
    raise exception 'Droits insuffisants' using errcode='42501'; end if;
  if p_plan is null or p_plan not in ('essential','business') then
    raise exception 'Offre invalide' using errcode='22023'; end if;
  insert into public.billing_requests(organization_id,requested_by,plan)
    values (actor.organization_id,actor.id,p_plan)
    on conflict (organization_id,plan) where status in ('requested','awaiting_payment')
    do update set updated_at=now() returning * into result;
  return to_jsonb(result);
end;
$$;

revoke all on function public.update_team_member_role(uuid,text), public.deactivate_team_member(uuid), public.request_qonto_billing(text) from public,anon;
grant execute on function public.update_team_member_role(uuid,text), public.deactivate_team_member(uuid), public.request_qonto_billing(text) to authenticated,service_role;
notify pgrst,'reload schema';
