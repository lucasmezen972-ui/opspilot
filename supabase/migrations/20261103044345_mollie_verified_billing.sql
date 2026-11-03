-- Mollie credentials live in Supabase Vault, never in a client-readable table.
alter table public.billing_requests add column if not exists payment_provider text not null default 'qonto'
  check (payment_provider in ('qonto','mollie'));
alter table public.billing_requests add column if not exists mollie_payment_id text;
alter table public.billing_requests add column if not exists amount_cents integer;
alter table public.billing_requests add column if not exists paid_until timestamptz;
alter table public.subscriptions add column if not exists mollie_payment_id text;

create table if not exists public.mollie_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.billing_requests(id),
  created_by uuid not null references public.profiles(id),
  profile_id text not null,
  mode text not null check (mode in ('live','test')),
  amount_cents integer not null check (amount_cents between 50 and 1000000),
  invoice_reference text not null check (length(invoice_reference) between 1 and 200),
  paid_until timestamptz not null,
  status text not null default 'creating' check (status in
    ('creating','open','pending','authorized','paid','failed','canceled','expired','needs_review')),
  payment_id text unique,
  checkout_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists mollie_one_pending_attempt
  on public.mollie_payment_attempts(request_id,mode)
  where status in ('creating','open','pending','authorized');
alter table public.mollie_payment_attempts enable row level security;
revoke all on table public.mollie_payment_attempts from public,anon,authenticated;
grant all on table public.mollie_payment_attempts to service_role;

create or replace function public.get_mollie_billing_config(p_mode text default 'live')
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare config jsonb; credential text;
begin
  if p_mode is null or p_mode not in ('live','test') then raise exception 'Mode invalide'; end if;
  select value into config from public.platform_settings where key='mollie_billing';
  select decrypted_secret into credential from vault.decrypted_secrets
    where name='opspilot_mollie_'||p_mode||'_v1';
  return jsonb_build_object('api_key',credential,
    'status_api_key',(select decrypted_secret from vault.decrypted_secrets where name='opspilot_mollie_status_v1'),
    'profile_id',config->>'profile_id',
    'app_url',config->>'app_url','mode',p_mode,
    'enabled',coalesce((config->>'enabled')::boolean,false));
end;
$$;
revoke all on function public.get_mollie_billing_config(text) from public,anon,authenticated;
grant execute on function public.get_mollie_billing_config(text) to service_role;

-- Only the Edge Function can reserve a quote. It passes the verified admin id.
create or replace function public.prepare_mollie_payment(
  p_request_id uuid,p_actor_id uuid,p_amount_cents integer,p_invoice_reference text,
  p_paid_until timestamptz,p_mode text,p_profile_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare request public.billing_requests; attempt public.mollie_payment_attempts;
begin
  if not exists(select 1 from public.profiles where id=p_actor_id and role='superadmin' and is_active is true) then
    raise exception 'backoffice_forbidden' using errcode='42501'; end if;
  if p_amount_cents is null or p_amount_cents not between 50 and 1000000 or
    nullif(trim(p_invoice_reference),'') is null or length(p_invoice_reference)>200 or
    p_paid_until is null or p_paid_until<=now() or p_paid_until>now()+interval '13 months' or
    p_mode is null or p_mode not in ('live','test') or p_profile_id is null or
    p_profile_id is distinct from (select value->>'profile_id' from public.platform_settings where key='mollie_billing') then
    raise exception 'Facture, montant TTC, période ou profil invalide' using errcode='22023'; end if;
  select * into request from public.billing_requests where id=p_request_id for update;
  if not found or request.status not in ('requested','awaiting_payment') then raise exception 'Demande non payable'; end if;
  if request.payment_provider='qonto' and request.payment_url is not null then
    raise exception 'Un lien Qonto est déjà associé à cette facture'; end if;
  select * into attempt from public.mollie_payment_attempts where request_id=p_request_id and mode=p_mode
    and status in ('creating','open','pending','authorized') for update;
  if found then
    if attempt.amount_cents<>p_amount_cents or attempt.invoice_reference<>trim(p_invoice_reference) or
      attempt.paid_until<>p_paid_until or attempt.profile_id<>p_profile_id then
      raise exception 'Un paiement existe déjà avec une autre facture ou période'; end if;
    -- Mollie only retains idempotency keys for one hour. Do not retry an
    -- ambiguous old creation after that window and risk two payable links.
    if attempt.status='creating' and attempt.created_at<now()-interval '50 minutes' then
      raise exception 'Vérifiez le paiement dans Mollie avant toute nouvelle tentative'; end if;
  else
    insert into public.mollie_payment_attempts(request_id,created_by,profile_id,mode,amount_cents,invoice_reference,paid_until)
    values(p_request_id,p_actor_id,p_profile_id,p_mode,p_amount_cents,trim(p_invoice_reference),p_paid_until)
    returning * into attempt;
    insert into public.admin_audit_log(actor_id,action,target)
    values(p_actor_id,'mollie.quote_prepared',jsonb_build_object('request_id',p_request_id,'attempt_id',attempt.id,
      'amount_cents',p_amount_cents,'reference',trim(p_invoice_reference),'paid_until',p_paid_until,'mode',p_mode));
  end if;
  return to_jsonb(attempt)||jsonb_build_object('organization_id',request.organization_id,'plan',request.plan);
end;
$$;
revoke all on function public.prepare_mollie_payment(uuid,uuid,integer,text,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.prepare_mollie_payment(uuid,uuid,integer,text,timestamptz,text,text) to service_role;

create or replace function public.attach_mollie_payment(p_attempt_id uuid,p_payment_id text,p_checkout_url text)
returns void language plpgsql security definer set search_path=public,pg_temp
as $$
declare attempt public.mollie_payment_attempts;
begin
  if p_payment_id is null or p_payment_id !~ '^tr_[A-Za-z0-9]{5,100}$' or p_checkout_url is null or
    length(p_checkout_url)>2048 or p_checkout_url !~ '^https://(www[.]mollie[.]com/checkout/|checkout[.]mollie[.]com/)[^[:space:]]+$' then
    raise exception 'Paiement ou destination invalide'; end if;
  select * into attempt from public.mollie_payment_attempts where id=p_attempt_id for update;
  if not found or attempt.status not in ('creating','open') or
    (attempt.payment_id is not null and attempt.payment_id<>p_payment_id) then raise exception 'Tentative non modifiable'; end if;
  update public.mollie_payment_attempts set payment_id=p_payment_id,checkout_url=p_checkout_url,
    status='open',updated_at=now() where id=p_attempt_id;
  if attempt.mode='live' then
    update public.billing_requests set payment_provider='mollie',mollie_payment_id=p_payment_id,
      amount_cents=attempt.amount_cents,paid_until=attempt.paid_until,qonto_reference=attempt.invoice_reference,
      payment_url=p_checkout_url,status='awaiting_payment',updated_at=now() where id=attempt.request_id;
  end if;
end;
$$;
revoke all on function public.attach_mollie_payment(uuid,text,text) from public,anon,authenticated;
grant execute on function public.attach_mollie_payment(uuid,text,text) to service_role;

-- Data below is fetched by the server from Mollie, never from the webhook body.
-- Recheck the binding in SQL as well as in the Edge Function.
create or replace function public.apply_mollie_payment(p_attempt_id uuid,p_payment jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare attempt public.mollie_payment_attempts; request public.billing_requests;
  payment_status text; paid_at timestamptz; changed boolean:=false;
begin
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
        update public.organizations set subscription_plan=request.plan,
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
