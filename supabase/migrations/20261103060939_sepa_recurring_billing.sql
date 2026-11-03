-- Align tenant plan codes with the live basic/pro/enterprise constraint.
create or replace function public.apply_mollie_payment(p_attempt_id uuid,p_payment jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare attempt public.mollie_payment_attempts; request public.billing_requests;
  payment_status text; paid_at timestamptz; changed boolean:=false;
begin
  select * into attempt from public.mollie_payment_attempts where id=p_attempt_id;
  if not found then raise exception 'Tentative introuvable'; end if;
  perform 1 from public.billing_requests where id=attempt.request_id for update;
  select * into attempt from public.mollie_payment_attempts where id=p_attempt_id for update;
  if not found then raise exception 'Tentative introuvable'; end if;
  select * into request from public.billing_requests where id=attempt.request_id for update;
  if p_payment->>'id' is distinct from attempt.payment_id or
    p_payment->>'profileId' is distinct from attempt.profile_id or
    p_payment->>'mode' is distinct from attempt.mode or
    p_payment#>>'{amount,currency}' is distinct from 'EUR' or
    p_payment#>>'{amount,value}' is distinct from to_char(attempt.amount_cents/100.0,'FM999999990.00') or
    p_payment#>>'{metadata,purpose}' is distinct from 'opspilot_billing_v1' or
    p_payment#>>'{metadata,attempt_id}' is distinct from attempt.id::text or
    p_payment#>>'{metadata,request_id}' is distinct from request.id::text or
    p_payment#>>'{metadata,organization_id}' is distinct from request.organization_id::text or
    p_payment#>>'{metadata,plan}' is distinct from request.plan or
    p_payment#>>'{metadata,invoice_reference}' is distinct from attempt.invoice_reference then
    raise exception 'Le paiement ne correspond pas à la facture' using errcode='22023'; end if;
  payment_status:=p_payment->>'status';
  if payment_status not in ('open','pending','authorized','paid','failed','canceled','expired') or payment_status is null then
    raise exception 'Statut inconnu'; end if;
  if coalesce((p_payment#>>'{amountRefunded,value}')::numeric,0)>0 or
    coalesce((p_payment#>>'{amountChargedBack,value}')::numeric,0)>0 then
    update public.mollie_payment_attempts set status='needs_review',updated_at=now() where id=attempt.id;
    if attempt.mode='live' then
      update public.subscriptions set status='past_due',updated_at=now()
        where organization_id=request.organization_id and mollie_payment_id=attempt.payment_id;
    end if;
    if attempt.status<>'needs_review' then
      insert into public.admin_audit_log(actor_id,action,target) values(attempt.created_by,'mollie.reversal_review',
        jsonb_build_object('attempt_id',attempt.id,'payment_id',attempt.payment_id,'mode',attempt.mode));
    end if;
    return jsonb_build_object('status','needs_review','activated',false);
  end if;
  if attempt.status='paid' then return jsonb_build_object('status','paid','activated',false); end if;
  if attempt.status='needs_review' then return jsonb_build_object('status','needs_review','activated',false); end if;
  if payment_status='paid' then
    paid_at:=(p_payment->>'paidAt')::timestamptz;
    if paid_at is null or paid_at>now()+interval '5 minutes' or attempt.paid_until<=now() then
      update public.mollie_payment_attempts set status='needs_review',updated_at=now() where id=attempt.id;
      return jsonb_build_object('status','needs_review','activated',false);
    end if;
    -- Test payments can be reconciled, but can never unlock a paid subscription.
    if attempt.mode='live' then
      if request.status not in ('requested','awaiting_payment') or
        request.mollie_payment_id is distinct from attempt.payment_id then raise exception 'Facture non payable'; end if;
      perform 1 from public.organizations where id=request.organization_id for update;
      insert into public.subscriptions(organization_id,plan,status,billing_provider,qonto_reference,mollie_payment_id,current_period_end)
      values(request.organization_id,request.plan,'active','mollie',attempt.invoice_reference,attempt.payment_id,attempt.paid_until)
      on conflict(organization_id) do update set plan=excluded.plan,status='active',billing_provider='mollie',
        qonto_reference=excluded.qonto_reference,mollie_payment_id=excluded.mollie_payment_id,
        current_period_end=excluded.current_period_end,updated_at=now()
      where public.subscriptions.current_period_end is null or public.subscriptions.current_period_end<excluded.current_period_end
        or (public.subscriptions.current_period_end=excluded.current_period_end and
          (public.subscriptions.plan=excluded.plan or (public.subscriptions.plan='essential' and excluded.plan='business')));
      if found then
        update public.organizations set subscription_plan=case when request.plan='business' then 'pro' else 'basic' end,
          max_users=case when request.plan='business' then 75 else 15 end,
          max_stores=case when request.plan='business' then 5 else 1 end where id=request.organization_id;
        changed:=true;
      end if;
      update public.billing_requests set status='paid',updated_at=now() where id=request.id;
      insert into public.admin_audit_log(actor_id,action,target) values(attempt.created_by,'mollie.payment_confirmed',
        jsonb_build_object('request_id',request.id,'payment_id',attempt.payment_id,'reference',attempt.invoice_reference,
          'amount_cents',attempt.amount_cents,'paid_until',attempt.paid_until,'source','provider_api'));
    end if;
  elsif payment_status in ('failed','canceled','expired') and attempt.mode='live' then
    update public.billing_requests set status='requested',payment_url=null,mollie_payment_id=null,updated_at=now()
      where id=request.id and mollie_payment_id=attempt.payment_id and status='awaiting_payment';
  end if;
  update public.mollie_payment_attempts set status=payment_status,updated_at=now() where id=attempt.id;
  return jsonb_build_object('status',payment_status,'activated',changed);
end;
$$;
revoke all on function public.apply_mollie_payment(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_mollie_payment(uuid,jsonb) to service_role;
notify pgrst,'reload schema';

-- Keep manual Qonto confirmation separate from API-verified Mollie payments.
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
    where id=p_request_id and payment_provider='qonto' and mollie_payment_id is null and status in ('requested','awaiting_payment');
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
  if not found or request.payment_provider<>'qonto' or request.mollie_payment_id is not null or request.status not in ('requested','awaiting_payment') then raise exception 'Demande non payable'; end if;
  if request.qonto_reference is not null and request.qonto_reference<>trim(p_reference) then raise exception 'La référence diffère de la facture préparée'; end if;
  insert into public.subscriptions(organization_id,plan,status,billing_provider,qonto_reference,current_period_end)
    values(request.organization_id,request.plan,'active','qonto',trim(p_reference),p_paid_until)
    on conflict(organization_id) do update set plan=excluded.plan,status=excluded.status,
      billing_provider='qonto',mollie_payment_id=null,qonto_reference=excluded.qonto_reference,current_period_end=excluded.current_period_end,updated_at=now()
      where public.subscriptions.current_period_end is null or public.subscriptions.current_period_end<excluded.current_period_end
      or (public.subscriptions.current_period_end=excluded.current_period_end and (public.subscriptions.plan=excluded.plan or (public.subscriptions.plan='essential' and excluded.plan='business')));
  if found then
  update public.organizations set subscription_plan=case when request.plan='business' then 'pro' else 'basic' end,
    max_users=case when request.plan='business' then 75 else 15 end,
    max_stores=case when request.plan='business' then 5 else 1 end
    where id=request.organization_id;
  end if;
  update public.billing_requests set status='paid',qonto_reference=trim(p_reference),updated_at=now() where id=request.id;
  insert into public.admin_audit_log(actor_id,action,target)
    values(auth.uid(),'qonto.payment_confirmed',jsonb_build_object('request_id',request.id,'reference',p_reference,'paid_until',p_paid_until));
end;
$$;
revoke all on function public.confirm_qonto_payment(uuid,text,timestamptz) from public,anon;
grant execute on function public.confirm_qonto_payment(uuid,text,timestamptz) to authenticated,service_role;
-- Recurring agreements are server-owned and never contain an IBAN or bank secret.
create table if not exists public.mollie_recurring_agreements (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 request_id uuid not null references public.billing_requests(id), created_by uuid not null references public.profiles(id),
 mode text not null check(mode in ('test','live')), profile_id text not null,
 plan text not null check(plan in ('essential','business')), amount_cents integer not null check(amount_cents between 50 and 100000),
 interval_months integer not null default 1 check(interval_months in (1,12)), invoice_reference text not null,
 first_paid_until timestamptz not null, next_charge_date date not null,
 status text not null default 'draft' check(status in ('draft','authorizing','awaiting_first_payment','mandate_pending','active','paused','canceling','canceled','needs_review')),
 consented_by uuid references public.profiles(id), consented_at timestamptz, consent_version text, consent_snapshot jsonb,
 customer_id text, first_payment_id text unique, checkout_url text, mandate_id text, provider_subscription_id text unique,
 creation_started_at timestamptz, subscription_started_at timestamptz, provider_status text, provider_next_charge_date date, created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists mollie_recurring_one_agreement on public.mollie_recurring_agreements(organization_id,mode) where status<>'canceled';
create table if not exists public.mollie_recurring_payments (
 payment_id text primary key, agreement_id uuid not null references public.mollie_recurring_agreements(id),
 mode text not null check(mode in ('test','live')),status text not null, amount_cents integer not null, period_end timestamptz,
 invoice_reference text, created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.mollie_recurring_agreements enable row level security;
alter table public.mollie_recurring_payments enable row level security;
revoke all on public.mollie_recurring_agreements,public.mollie_recurring_payments from public,anon,authenticated;
grant all on public.mollie_recurring_agreements,public.mollie_recurring_payments to service_role;
create index if not exists sepa_request_idx on public.mollie_recurring_agreements(request_id);
create index if not exists sepa_organization_idx on public.mollie_recurring_agreements(organization_id);
create index if not exists sepa_creator_idx on public.mollie_recurring_agreements(created_by);
create index if not exists sepa_consent_actor_idx on public.mollie_recurring_agreements(consented_by);
create index if not exists sepa_payment_agreement_idx on public.mollie_recurring_payments(agreement_id);
create unique index if not exists sepa_invoice_unique on public.mollie_recurring_payments(mode,invoice_reference) where invoice_reference is not null;

create or replace function public.get_mollie_recurring_config(p_mode text default 'live')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c jsonb; base jsonb;
begin
 base:=public.get_mollie_billing_config(p_mode);
 select value into c from public.platform_settings where key='mollie_billing';
 return base||jsonb_build_object('api_key',(select decrypted_secret from vault.decrypted_secrets where name='opspilot_mollie_recurring_'||p_mode||'_v1'),
 'enabled',coalesce((c->>'recurring_enabled')::boolean,false));
end $$;
revoke all on function public.get_mollie_recurring_config(text) from public,anon,authenticated;
grant execute on function public.get_mollie_recurring_config(text) to service_role;

create or replace function public.get_sepa_agreements()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.profiles; result jsonb;
begin
 select * into actor from public.profiles where id=auth.uid();
 if not public.has_active_profile() or actor.role not in ('admin','owner','superadmin') then raise exception 'Accès réservé à la facturation' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'request_id',a.request_id,'organization_id',a.organization_id,'organization_name',o.name,'plan',a.plan,
  'amount_cents',a.amount_cents,'interval_months',a.interval_months,'next_charge_date',a.next_charge_date,'status',a.status,
  'consented_at',a.consented_at,'first_paid_until',a.first_paid_until,'mandate_ready',a.mandate_id is not null,'provider_status',a.provider_status,'provider_next_charge_date',a.provider_next_charge_date,'checkout_url',a.checkout_url,'invoice_reference',a.invoice_reference,
  'payments',(select coalesce(jsonb_agg(jsonb_build_object('payment_id',p.payment_id,'status',p.status,'amount_cents',p.amount_cents,'period_end',p.period_end,'invoice_reference',p.invoice_reference) order by p.created_at desc),'[]') from public.mollie_recurring_payments p where p.agreement_id=a.id)) order by a.created_at desc),'[]') into result
 from public.mollie_recurring_agreements a join public.organizations o on o.id=a.organization_id
 where a.mode='live' and (actor.role='superadmin' or a.organization_id=actor.organization_id);
 return result;
end $$;
revoke all on function public.get_sepa_agreements() from public,anon;
grant execute on function public.get_sepa_agreements() to authenticated,service_role;

create or replace function public.prepare_sepa_agreement(p_actor_id uuid,p_request_id uuid,p_amount_cents integer,p_invoice_reference text,p_first_paid_until timestamptz,p_interval_months integer,p_mode text,p_profile_id text)
returns public.mollie_recurring_agreements language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.billing_requests; a public.mollie_recurring_agreements;
begin
 if not exists(select 1 from public.profiles p where p.id=p_actor_id and p.is_active and p.role='superadmin') then raise exception 'Accès refusé' using errcode='42501'; end if;
 if p_amount_cents is null or p_amount_cents not between 50 and 100000 or p_interval_months is null or p_interval_months not in (1,12) or
  nullif(trim(p_invoice_reference),'') is null or length(p_invoice_reference)>200 or p_mode is null or p_mode not in ('test','live') or
  p_first_paid_until is null or p_first_paid_until<now()+interval '14 days' or p_first_paid_until>now()+interval '13 months' or
  p_profile_id is distinct from (select value->>'profile_id' from public.platform_settings where key='mollie_billing') then raise exception 'Facture, montant ou calendrier invalide'; end if;
 select * into r from public.billing_requests where id=p_request_id for update;
 if not found or r.status<>'requested' or r.payment_url is not null then raise exception 'Facture non disponible'; end if;
 if exists(select 1 from public.mollie_payment_attempts where request_id=r.id and mode=p_mode and status not in ('failed','expired','canceled')) then raise exception 'Un règlement existe déjà'; end if;
 perform public.reserve_billing_invoice(p_mode,trim(p_invoice_reference),r.id,'sepa');
 select * into a from public.mollie_recurring_agreements where organization_id=r.organization_id and mode=p_mode and status<>'canceled' for update;
 if found then
  if a.request_id<>r.id or a.amount_cents<>p_amount_cents or a.invoice_reference<>trim(p_invoice_reference) or a.first_paid_until<>p_first_paid_until or a.interval_months<>p_interval_months then raise exception 'Un calendrier SEPA existe déjà'; end if;
  return a;
 end if;
 insert into public.mollie_recurring_agreements(organization_id,request_id,created_by,mode,profile_id,plan,amount_cents,interval_months,invoice_reference,first_paid_until,next_charge_date)
 values(r.organization_id,r.id,p_actor_id,p_mode,p_profile_id,r.plan,p_amount_cents,p_interval_months,trim(p_invoice_reference),p_first_paid_until,(p_first_paid_until at time zone 'UTC')::date+1) returning * into a;
 return a;
end $$;
revoke all on function public.prepare_sepa_agreement(uuid,uuid,integer,text,timestamptz,integer,text,text) from public,anon,authenticated;
grant execute on function public.prepare_sepa_agreement(uuid,uuid,integer,text,timestamptz,integer,text,text) to service_role;

create or replace function public.consent_sepa_agreement(p_actor_id uuid,p_agreement_id uuid)
returns public.mollie_recurring_agreements language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.mollie_recurring_agreements; actor public.profiles;
begin
 select * into actor from public.profiles where id=p_actor_id and is_active;
 select * into a from public.mollie_recurring_agreements where id=p_agreement_id for update;
 if actor.id is null or a.id is null or actor.organization_id<>a.organization_id or actor.role not in ('admin','owner') then raise exception 'Autorisation du représentant client requise' using errcode='42501'; end if;
 if a.status not in ('draft','authorizing','awaiting_first_payment') then raise exception 'Calendrier non modifiable'; end if;
 if a.status='draft' then
  if a.next_charge_date<current_date+14 then raise exception 'Le calendrier doit être revalidé'; end if;
  update public.mollie_recurring_agreements set consented_by=actor.id,consented_at=now(),consent_version='opspilot_sepa_v1',consent_snapshot=jsonb_build_object('amount_cents',a.amount_cents,'currency','EUR','interval_months',a.interval_months,'first_invoice',a.invoice_reference,'first_paid_until',a.first_paid_until,'next_charge_date',a.next_charge_date,'channel','in_app_acceptance'),status='authorizing',creation_started_at=now(),updated_at=now() where id=a.id returning * into a;
 end if;
 return a;
end $$;
revoke all on function public.consent_sepa_agreement(uuid,uuid) from public,anon,authenticated;
grant execute on function public.consent_sepa_agreement(uuid,uuid) to service_role;

create or replace function public.apply_sepa_payment(p_agreement_id uuid,p_payment jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.mollie_recurring_agreements; previous public.mollie_recurring_payments; payment_status text; period_end timestamptz; is_first boolean; reversed boolean; changed boolean:=false;
begin
 select * into a from public.mollie_recurring_agreements where id=p_agreement_id for update;
 if not found or a.consented_at is null or a.customer_id is null or nullif(p_payment->>'id','') is null or p_payment->>'id' !~ '^tr_[A-Za-z0-9]{5,100}$' or
  p_payment->>'profileId' is distinct from a.profile_id or p_payment->>'mode' is distinct from a.mode or p_payment->>'customerId' is distinct from a.customer_id or
  p_payment#>>'{amount,currency}' is distinct from 'EUR' or p_payment#>>'{amount,value}' is distinct from to_char(a.amount_cents/100.0,'FM999999990.00') then raise exception 'Paiement non conforme'; end if;
 is_first:=p_payment->>'id'=a.first_payment_id;
 if is_first then
  if p_payment->>'sequenceType' is distinct from 'first' or p_payment#>>'{metadata,agreement_id}' is distinct from a.id::text or p_payment#>>'{metadata,purpose}' is distinct from 'opspilot_sepa_v1' then raise exception 'Premier paiement non conforme'; end if;
  period_end:=a.first_paid_until;
 else
  if a.provider_subscription_id is null or p_payment->>'subscriptionId' is distinct from a.provider_subscription_id or p_payment->>'sequenceType' is distinct from 'recurring' or p_payment->>'method' is distinct from 'directdebit' then raise exception 'Échéance non conforme'; end if;
  if p_payment->>'createdAt' is null or (p_payment->>'createdAt')::timestamptz>now()+interval '5 minutes' or (p_payment->>'createdAt')::timestamptz<a.consented_at then raise exception 'Date incohérente'; end if;
  -- A provider creation timestamp is not an invoice service period. Qonto's
  -- exact renewal period must be reconciled by the operator before granting it.
  select p.period_end into period_end from public.mollie_recurring_payments p where payment_id=p_payment->>'id';
 end if;
 if is_first and period_end is null then raise exception 'Période manquante'; end if;
 payment_status:=p_payment->>'status';
 if payment_status is null or payment_status not in ('open','pending','authorized','paid','failed','canceled','expired') then raise exception 'Statut inconnu'; end if;
 reversed:=coalesce((p_payment#>>'{amountRefunded,value}')::numeric,0)>0 or coalesce((p_payment#>>'{amountChargedBack,value}')::numeric,0)>0;
 select * into previous from public.mollie_recurring_payments where payment_id=p_payment->>'id' for update;
 if previous.payment_id is not null and previous.agreement_id<>a.id then raise exception 'Paiement déjà rapproché'; end if;
 if previous.status in ('paid','needs_review') and not reversed then return jsonb_build_object('status',previous.status,'activated',false); end if;
 if reversed then payment_status:='needs_review'; end if;
 if payment_status='paid' and ((p_payment->>'paidAt')::timestamptz is null or (p_payment->>'paidAt')::timestamptz>now()+interval '5 minutes' or period_end<=now()) then payment_status:='needs_review'; end if;
 insert into public.mollie_recurring_payments(payment_id,agreement_id,mode,status,amount_cents,period_end,invoice_reference)
 values(p_payment->>'id',a.id,a.mode,payment_status,a.amount_cents,period_end,case when is_first then a.invoice_reference else null end)
 on conflict(payment_id) do update set status=excluded.status,updated_at=now();
 if a.mode='live' then
  perform 1 from public.organizations where id=a.organization_id for update;
  if payment_status='paid' and period_end is not null then
   insert into public.subscriptions(organization_id,plan,status,billing_provider,mollie_payment_id,qonto_reference,current_period_end)
   values(a.organization_id,a.plan,'active','mollie',p_payment->>'id',case when is_first then a.invoice_reference else null end,period_end)
   on conflict(organization_id) do update set plan=excluded.plan,status='active',billing_provider='mollie',mollie_payment_id=excluded.mollie_payment_id,qonto_reference=excluded.qonto_reference,current_period_end=excluded.current_period_end,updated_at=now()
   where public.subscriptions.current_period_end is null or public.subscriptions.current_period_end<excluded.current_period_end
    or (public.subscriptions.current_period_end=excluded.current_period_end and (public.subscriptions.plan=excluded.plan or (public.subscriptions.plan='essential' and excluded.plan='business')));
   if found then
    changed:=true;
    update public.organizations set subscription_plan=case when a.plan='business' then 'pro' else 'basic' end,max_users=case when a.plan='business' then 75 else 15 end,max_stores=case when a.plan='business' then 5 else 1 end where id=a.organization_id;
   end if;
   if is_first then update public.billing_requests set status='paid',payment_provider='mollie',mollie_payment_id=a.first_payment_id,payment_url=null,qonto_reference=a.invoice_reference,amount_cents=a.amount_cents,paid_until=a.first_paid_until where id=a.request_id; end if;
  elsif payment_status in ('failed','canceled','expired','needs_review') then
   update public.subscriptions set status='past_due',updated_at=now() where organization_id=a.organization_id and (current_period_end<=now() or mollie_payment_id=p_payment->>'id');
  end if;
 end if;
 if payment_status in ('failed','canceled','expired','needs_review') then update public.mollie_recurring_agreements set status='needs_review',updated_at=now() where id=a.id;
 elsif is_first and payment_status='paid' and a.status not in ('active','canceled','canceling','paused') then update public.mollie_recurring_agreements set status='mandate_pending',updated_at=now() where id=a.id; end if;
 return jsonb_build_object('status',payment_status,'activated',changed,'first',is_first);
end $$;
revoke all on function public.apply_sepa_payment(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_sepa_payment(uuid,jsonb) to service_role;

-- Reserve an invoice for one payment channel; a second payable link is forbidden.
create table if not exists public.billing_invoice_reservations (
 mode text not null,reference text not null,request_id uuid not null references public.billing_requests(id),channel text not null,
 primary key(mode,reference),check(mode in ('test','live')),check(channel in ('qonto','oneoff','sepa'))
);
alter table public.billing_invoice_reservations enable row level security;
revoke all on public.billing_invoice_reservations from public,anon,authenticated;
grant all on public.billing_invoice_reservations to service_role;
create index if not exists billing_invoice_request_idx on public.billing_invoice_reservations(request_id);
insert into public.billing_invoice_reservations(mode,reference,request_id,channel)
 select distinct on(mode,invoice_reference) mode,invoice_reference,request_id,'oneoff' from public.mollie_payment_attempts where status not in ('failed','expired','canceled') order by mode,invoice_reference,created_at desc on conflict do nothing;
insert into public.billing_invoice_reservations(mode,reference,request_id,channel)
 select 'live',trim(qonto_reference),id,'qonto' from public.billing_requests where payment_provider='qonto' and status in ('paid','awaiting_payment') and nullif(trim(qonto_reference),'') is not null on conflict do nothing;
create or replace function public.reserve_billing_invoice(p_mode text,p_reference text,p_request_id uuid,p_channel text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.billing_invoice_reservations;
begin
 insert into public.billing_invoice_reservations(mode,reference,request_id,channel) values(p_mode,p_reference,p_request_id,p_channel) on conflict do nothing;
 select * into r from public.billing_invoice_reservations where mode=p_mode and reference=p_reference for update;
 if r.request_id is distinct from p_request_id or r.channel is distinct from p_channel then raise exception 'Cette facture est déjà réservée à un autre règlement'; end if;
end $$;
revoke all on function public.reserve_billing_invoice(text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_billing_invoice(text,text,uuid,text) to service_role;
create or replace function public.guard_recurring_invoice()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if exists(select 1 from public.mollie_recurring_agreements where request_id=new.request_id and mode=new.mode and status<>'canceled') then raise exception 'Cette facture est réservée au calendrier SEPA'; end if;
 perform public.reserve_billing_invoice(new.mode,new.invoice_reference,new.request_id,'oneoff');
 return new;
end $$;
revoke all on function public.guard_recurring_invoice() from public,anon,authenticated;
drop trigger if exists guard_recurring_invoice on public.mollie_payment_attempts;
create trigger guard_recurring_invoice before insert on public.mollie_payment_attempts for each row execute function public.guard_recurring_invoice();
create or replace function public.guard_billing_invoice_channel()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare channel text;
begin
 if nullif(trim(new.qonto_reference),'') is not null and (new.payment_url is not null or new.status='paid') then
  channel:=case when new.payment_provider='qonto' then 'qonto' when exists(select 1 from public.mollie_recurring_agreements where request_id=new.id and first_payment_id=new.mollie_payment_id and mode='live') then 'sepa' else 'oneoff' end;
  perform public.reserve_billing_invoice('live',trim(new.qonto_reference),new.id,channel);
 end if;
 return new;
end $$;
revoke all on function public.guard_billing_invoice_channel() from public,anon,authenticated;
drop trigger if exists guard_billing_invoice_channel on public.billing_requests;
create trigger guard_billing_invoice_channel before update on public.billing_requests for each row execute function public.guard_billing_invoice_channel();

-- Recording a Qonto reference and its actual service period is atomic. No invoice
-- is created here and an already reconciled renewal cannot be reassigned.
create or replace function public.reconcile_sepa_invoice(p_actor_id uuid,p_agreement_id uuid,p_payment_id text,p_reference text,p_paid_until timestamptz)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.mollie_recurring_agreements; p public.mollie_recurring_payments;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and role='superadmin' and is_active) then raise exception 'Accès refusé' using errcode='42501'; end if;
 select * into a from public.mollie_recurring_agreements where id=p_agreement_id for update;
 select * into p from public.mollie_recurring_payments where payment_id=p_payment_id and agreement_id=a.id for update;
 if p.payment_id is null or p.status<>'paid' or nullif(trim(p_reference),'') is null or length(p_reference)>200 or p_paid_until is null or p_paid_until<=now() or p_paid_until>now()+interval '13 months' then raise exception 'Facture, règlement et période requis'; end if;
 if p.invoice_reference is not null and (p.invoice_reference<>trim(p_reference) or p.period_end is distinct from p_paid_until) then raise exception 'Facture déjà rapprochée'; end if;
 perform public.reserve_billing_invoice(a.mode,trim(p_reference),a.request_id,'sepa');
 update public.mollie_recurring_payments set invoice_reference=trim(p_reference),period_end=p_paid_until,updated_at=now() where payment_id=p.payment_id;
 if a.mode='live' then
  perform 1 from public.organizations where id=a.organization_id for update;
  insert into public.subscriptions(organization_id,plan,status,billing_provider,mollie_payment_id,qonto_reference,current_period_end)
   values(a.organization_id,a.plan,'active','mollie',p.payment_id,trim(p_reference),p_paid_until)
   on conflict(organization_id) do update set plan=excluded.plan,status='active',billing_provider='mollie',mollie_payment_id=excluded.mollie_payment_id,qonto_reference=excluded.qonto_reference,current_period_end=excluded.current_period_end,updated_at=now()
   where public.subscriptions.current_period_end is null or public.subscriptions.current_period_end<excluded.current_period_end
    or (public.subscriptions.current_period_end=excluded.current_period_end and (public.subscriptions.plan=excluded.plan or (public.subscriptions.plan='essential' and excluded.plan='business')));
  if found then
  update public.organizations set subscription_plan=case when a.plan='business' then 'pro' else 'basic' end,max_users=case when a.plan='business' then 75 else 15 end,max_stores=case when a.plan='business' then 5 else 1 end
   where id=a.organization_id and exists(select 1 from public.subscriptions s where s.organization_id=a.organization_id and s.mollie_payment_id=p.payment_id);
  end if;
 end if;
 insert into public.admin_audit_log(actor_id,action,target) values(p_actor_id,'sepa.invoice_reconciled',jsonb_build_object('agreement_id',a.id,'reference',trim(p_reference),'mode',a.mode,'paid_until',p_paid_until));
end $$;
revoke all on function public.reconcile_sepa_invoice(uuid,uuid,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.reconcile_sepa_invoice(uuid,uuid,text,text,timestamptz) to service_role;
notify pgrst,'reload schema';
