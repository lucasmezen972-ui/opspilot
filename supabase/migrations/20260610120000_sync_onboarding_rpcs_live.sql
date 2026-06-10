/*
  OpsPilot V2 — Resynchronisation des RPC onboarding avec l'état réel du
  projet distant (appliqué directement sur Supabase V2 hpqfmuzkkxrqoqoabjmb).

  Remplace les versions de 20260609230000_v2_onboarding.sql :
  - retour jsonb (organization_id, store_id, role) au lieu de uuid ;
  - create_organization idempotent sur le profil (upsert) ;
  - abonnement trial 14 jours explicite ;
  - EXECUTE révoqué pour anon/public, accordé à authenticated uniquement.

  Le client (OnboardingScreen) ne lit que `error` : compatible.
*/

CREATE OR REPLACE FUNCTION public.create_organization(org_name text, store_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_org_id uuid;
  v_store_id uuid;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = 'P0001';
  end if;
  if org_name is null or length(trim(org_name)) = 0 then
    raise exception 'Le nom de l''organisation est requis' using errcode = 'P0001';
  end if;

  select email::text into v_email from public.users where id = v_uid;
  if v_email is null then
    select email::text into v_email from auth.users where id = v_uid;
    insert into public.users(id, email) values (v_uid, v_email)
      on conflict (id) do nothing;
  end if;

  insert into public.organizations(name) values (org_name) returning id into v_org_id;

  if store_name is not null and length(trim(store_name)) > 0 then
    insert into public.stores(organization_id, name) values (v_org_id, store_name)
      returning id into v_store_id;
  end if;

  insert into public.profiles(id, email, organization_id, store_id, role)
  values (v_uid, v_email, v_org_id, v_store_id, 'admin')
  on conflict (id) do update
    set organization_id = excluded.organization_id,
        store_id        = excluded.store_id,
        role            = 'admin';

  insert into public.subscriptions(organization_id, plan, status, trial_ends_at)
  values (v_org_id, 'trial', 'trialing', now() + interval '14 days')
  on conflict (organization_id) do nothing;

  return jsonb_build_object(
    'organization_id', v_org_id,
    'store_id',        v_store_id,
    'role',            'admin'
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.accept_invitation(invite_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_inv public.invitations%rowtype;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = 'P0001';
  end if;

  select email::text into v_email from public.users where id = v_uid;
  if v_email is null then
    select email::text into v_email from auth.users where id = v_uid;
  end if;

  select * into v_inv from public.invitations where token = invite_token;
  if not found then
    raise exception 'Invitation introuvable' using errcode = 'P0001';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'Invitation déjà traitée (statut: %)', v_inv.status using errcode = 'P0001';
  end if;
  if v_inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'Invitation expirée' using errcode = 'P0001';
  end if;
  if lower(v_inv.email) <> lower(v_email) then
    raise exception 'Cette invitation ne correspond pas à votre adresse email' using errcode = 'P0001';
  end if;

  insert into public.users(id, email) values (v_uid, v_email)
    on conflict (id) do nothing;

  insert into public.profiles(id, email, organization_id, store_id, role)
  values (v_uid, v_email, v_inv.organization_id, v_inv.store_id, v_inv.role)
  on conflict (id) do update
    set organization_id = excluded.organization_id,
        store_id        = excluded.store_id,
        role            = excluded.role;

  update public.invitations set status = 'accepted' where id = v_inv.id;

  return jsonb_build_object(
    'organization_id', v_inv.organization_id,
    'store_id',        v_inv.store_id,
    'role',            v_inv.role
  );
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_organization(text, text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;
