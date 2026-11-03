-- Commercial snapshots only. No payment, invoice or invitation is emitted.
create table if not exists public.customer_portal_accounts(
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.customer_portal_outbox(
  id bigint generated always as identity primary key check(id<=9007199254740991),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','sent','review')),
  attempts integer not null default 0 check(attempts>=0),
  next_attempt_at timestamptz not null default now(),
  lease uuid,
  lease_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists customer_portal_pending on public.customer_portal_outbox(next_attempt_at,id) where status='pending';
alter table public.customer_portal_accounts enable row level security;
alter table public.customer_portal_outbox enable row level security;
revoke all on public.customer_portal_accounts,public.customer_portal_outbox from public,anon,authenticated;
grant select,insert,update,delete on public.customer_portal_accounts,public.customer_portal_outbox to service_role;
revoke all on sequence public.customer_portal_outbox_id_seq from public,anon,authenticated;
grant usage,select on sequence public.customer_portal_outbox_id_seq to service_role;
insert into public.platform_settings(key,value) values('customer_portal_sync','{"enabled":false}'::jsonb) on conflict(key) do nothing;

create or replace function public.get_customer_portal_sync_config() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare enabled boolean; signing_key text;
begin
  select coalesce((value->>'enabled')::boolean,false) into enabled from public.platform_settings where key='customer_portal_sync';
  if enabled then select decrypted_secret into signing_key from vault.decrypted_secrets where name='opspilot_customer_portal_sync_v1' order by created_at desc limit 1; end if;
  return jsonb_build_object('enabled',coalesce(enabled,false),'signing_key',signing_key);
end $$;
revoke all on function public.get_customer_portal_sync_config() from public,anon,authenticated;
grant execute on function public.get_customer_portal_sync_config() to service_role;

create or replace function public.dispatch_customer_portal_sync() returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare worker_token text;
begin
  if not exists(select 1 from public.platform_settings where key='customer_portal_sync' and value->>'enabled'='true') then return; end if;
  if not exists(select 1 from public.customer_portal_outbox where status='pending' and next_attempt_at<=now() and (lease_until is null or lease_until<=now())) then return; end if;
  select value->>'token' into worker_token from public.platform_settings where key='email_worker_token';
  if coalesce(worker_token,'')='' then return; end if;
  perform net.http_post(url:='https://hpqfmuzkkxrqoqoabjmb.supabase.co/functions/v1/customer-portal-sync',headers:=jsonb_build_object('Content-Type','application/json','x-worker-token',worker_token),body:='{}'::jsonb,timeout_milliseconds:=15000);
end $$;
revoke all on function public.dispatch_customer_portal_sync() from public,anon,authenticated;
grant execute on function public.dispatch_customer_portal_sync() to service_role;

create or replace function public.queue_customer_portal_subscription(p_organization_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare sub public.subscriptions%rowtype; account public.customer_portal_accounts%rowtype; invoice public.billing_requests%rowtype; snapshot jsonb; previous jsonb; event_id bigint;
begin
  select * into sub from public.subscriptions where organization_id=p_organization_id order by updated_at desc,id desc limit 1 for update;
  if not found or sub.status='trialing' or coalesce(sub.billing_provider,'') not in ('qonto','mollie') then return; end if;
  -- Keep one stable commercial contact. A later email/profile change grants no new access.
  select * into account from public.customer_portal_accounts where organization_id=p_organization_id;
  if not found then
    if sub.status<>'active' then return; end if;
    insert into public.customer_portal_accounts(organization_id,company_name,contact_name,contact_email)
    select o.id,o.name,left(coalesce(nullif(btrim(p.full_name),''),o.name),100),lower(u.email)
      from public.billing_requests b join public.organizations o on o.id=b.organization_id
      join public.profiles p on p.id=b.requested_by and p.organization_id=o.id and p.is_active is true and p.role in ('admin','owner')
      join auth.users u on u.id=p.id and u.email_confirmed_at is not null
      where b.organization_id=p_organization_id and b.status='paid' and b.paid_until is not null and b.qonto_reference is not null
      and b.plan=sub.plan and b.qonto_reference=sub.qonto_reference
      order by b.updated_at desc,b.id desc limit 1
    on conflict(organization_id) do nothing;
    select * into account from public.customer_portal_accounts where organization_id=p_organization_id;
    if not found then return; end if;
  end if;
  select * into invoice from public.billing_requests where organization_id=p_organization_id and status='paid' and qonto_reference=sub.qonto_reference order by updated_at desc,id desc limit 1;
  snapshot:=jsonb_build_object('version',1,'accountId',p_organization_id::text,
    'company',jsonb_build_object('name',left(account.company_name,120),'contactName',account.contact_name,'email',account.contact_email),
    'service',jsonb_build_object('product','opspilot','plan',case sub.plan when 'essential' then 'Essentiel' when 'business' then 'Business' when 'enterprise' then 'Entreprise' else sub.plan end,'state',sub.status,
      'amount_cents',null,'interval','none','period_end',case when invoice.paid_until is null then null else to_char(invoice.paid_until at time zone 'UTC','YYYY-MM-DD') end,
      'invoice_reference',coalesce(invoice.qonto_reference,'')));
  select payload-'eventId'-'revision' into previous from public.customer_portal_outbox where organization_id=p_organization_id order by id desc limit 1;
  if previous=snapshot then return; end if;
  insert into public.customer_portal_outbox(organization_id,payload) values(p_organization_id,snapshot) returning id into event_id;
  update public.customer_portal_outbox set payload=snapshot||jsonb_build_object('eventId','opspilot:'||event_id::text,'revision',event_id) where id=event_id;
  perform public.dispatch_customer_portal_sync();
end $$;
revoke all on function public.queue_customer_portal_subscription(uuid) from public,anon,authenticated;
grant execute on function public.queue_customer_portal_subscription(uuid) to service_role;

create or replace function public.on_customer_portal_subscription() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if tg_op='UPDATE' and to_jsonb(new)=to_jsonb(old) then return new; end if;
  perform public.queue_customer_portal_subscription(new.organization_id);
  return new;
end $$;
revoke all on function public.on_customer_portal_subscription() from public,anon,authenticated;
drop trigger if exists customer_portal_subscription_changed on public.subscriptions;
create trigger customer_portal_subscription_changed after insert or update of status,plan,current_period_end,qonto_reference,billing_provider on public.subscriptions for each row execute function public.on_customer_portal_subscription();
drop trigger if exists customer_portal_invoice_paid on public.billing_requests;
create trigger customer_portal_invoice_paid after insert or update of status,qonto_reference,paid_until on public.billing_requests for each row execute function public.on_customer_portal_subscription();

create or replace function public.claim_customer_portal_events(p_limit integer default 10)
returns table(id bigint,lease uuid,payload jsonb)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare token uuid:=gen_random_uuid();
begin
  return query
  with batch as (select o.id from public.customer_portal_outbox o where o.status='pending' and o.next_attempt_at<=now() and (o.lease_until is null or o.lease_until<=now()) order by o.id for update skip locked limit greatest(1,least(coalesce(p_limit,10),20)))
  update public.customer_portal_outbox o set lease=token,lease_until=now()+interval '2 minutes',attempts=o.attempts+1
  from batch where o.id=batch.id returning o.id,o.lease,o.payload;
end $$;
revoke all on function public.claim_customer_portal_events(integer) from public,anon,authenticated;
grant execute on function public.claim_customer_portal_events(integer) to service_role;

create or replace function public.finish_customer_portal_event(p_id bigint,p_lease uuid,p_result text,p_code text default '')
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare changed integer;
begin
  if p_result is null or p_code is null or p_result not in ('sent','retry','review') or p_code !~ '^[a-z0-9_]{0,80}$' then raise exception 'invalid_delivery_result'; end if;
  update public.customer_portal_outbox set
    status=case when p_result='sent' then 'sent' when p_result='review' or attempts>=20 then 'review' else 'pending' end,
    last_error=nullif(p_code,''),delivered_at=case when p_result='sent' then now() else null end,
    next_attempt_at=now()+make_interval(secs=>least(3600,power(2,least(attempts,10))::integer*10)),lease=null,lease_until=null
    where id=p_id and lease=p_lease and status='pending';
  get diagnostics changed=row_count;
  return changed=1;
end $$;
revoke all on function public.finish_customer_portal_event(bigint,uuid,text,text) from public,anon,authenticated;
grant execute on function public.finish_customer_portal_event(bigint,uuid,text,text) to service_role;

-- The job only checks a disabled flag until explicitly configured. No backfill of real clients.
select cron.schedule('customer-portal-sync-retry','*/5 * * * *','select public.dispatch_customer_portal_sync()');
