alter table public.subscriptions add column if not exists billing_provider text not null default 'qonto';
alter table public.subscriptions add column if not exists qonto_reference text;

create table if not exists public.billing_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  requested_by uuid not null references public.profiles(id),
  plan text not null check (plan in ('essential','business')),
  status text not null default 'requested' check (status in ('requested','awaiting_payment','paid','canceled')),
  payment_url text,
  qonto_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists billing_requests_pending on public.billing_requests(organization_id,plan)
  where status in ('requested','awaiting_payment');
alter table public.billing_requests enable row level security;
revoke all on table public.billing_requests from public,anon,authenticated;
grant select on table public.billing_requests to authenticated;
grant all on table public.billing_requests to service_role;
drop policy if exists billing_request_read on public.billing_requests;
create policy billing_request_read on public.billing_requests for select to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_active is true
    and (p.role='superadmin' or (p.organization_id=billing_requests.organization_id and p.role in ('admin','owner'))))
);

create or replace function public.request_qonto_billing(p_plan text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare actor public.profiles; result public.billing_requests;
begin
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
revoke all on function public.request_qonto_billing(text) from public,anon;
grant execute on function public.request_qonto_billing(text) to authenticated,service_role;

create or replace function public.set_qonto_payment_link(p_request_id uuid,p_url text,p_reference text)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='superadmin' and is_active is true) then
    raise exception 'backoffice_forbidden' using errcode='42501'; end if;
  if p_url is null or p_url !~ '^https://pay[.]qonto[.]com/[^[:space:]]+$' or
     nullif(trim(p_reference),'') is null or length(p_url)>2048 or length(p_reference)>200 then
    raise exception 'Lien Qonto ou référence invalide' using errcode='22023'; end if;
  update public.billing_requests set payment_url=p_url,qonto_reference=trim(p_reference),
    status='awaiting_payment',updated_at=now()
    where id=p_request_id and status in ('requested','awaiting_payment');
  if not found then raise exception 'Demande non modifiable'; end if;
  insert into public.admin_audit_log(actor_id,action,target)
    values(auth.uid(),'qonto.link_attached',jsonb_build_object('request_id',p_request_id,'reference',p_reference));
end;
$$;
revoke all on function public.set_qonto_payment_link(uuid,text,text) from public,anon;
grant execute on function public.set_qonto_payment_link(uuid,text,text) to authenticated,service_role;

-- A redirect or a customer's claim never activates an account. Only the platform
-- operator confirms an actual Qonto payment, with a traceable invoice reference.
create or replace function public.confirm_qonto_payment(p_request_id uuid,p_reference text,p_paid_until timestamptz)
returns void language plpgsql security definer set search_path=public
as $$
declare request public.billing_requests;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='superadmin' and is_active is true) then
    raise exception 'backoffice_forbidden' using errcode='42501'; end if;
  if nullif(trim(p_reference),'') is null or length(p_reference)>200 or p_paid_until is null or p_paid_until<=now() then
    raise exception 'Référence et période réglée requises' using errcode='22023'; end if;
  select * into request from public.billing_requests where id=p_request_id for update;
  if not found or request.status not in ('requested','awaiting_payment') then raise exception 'Demande non payable'; end if;
  insert into public.subscriptions(organization_id,plan,status,billing_provider,qonto_reference,current_period_end)
    values(request.organization_id,request.plan,'active','qonto',trim(p_reference),p_paid_until)
    on conflict(organization_id) do update set plan=excluded.plan,status=excluded.status,
      billing_provider='qonto',qonto_reference=excluded.qonto_reference,current_period_end=excluded.current_period_end,updated_at=now();
  update public.organizations set subscription_plan=request.plan,
    max_users=case when request.plan='business' then 75 else 15 end,
    max_stores=case when request.plan='business' then 5 else 1 end
    where id=request.organization_id;
  update public.billing_requests set status='paid',qonto_reference=trim(p_reference),updated_at=now() where id=request.id;
  insert into public.admin_audit_log(actor_id,action,target)
    values(auth.uid(),'qonto.payment_confirmed',jsonb_build_object('request_id',request.id,'reference',p_reference,'paid_until',p_paid_until));
end;
$$;
revoke all on function public.confirm_qonto_payment(uuid,text,timestamptz) from public,anon;
grant execute on function public.confirm_qonto_payment(uuid,text,timestamptz) to authenticated,service_role;
notify pgrst,'reload schema';
