-- All synthetic fixtures and queued notifications roll back. Sync must stay disabled.
begin;
set local request.jwt.claim.role='service_role';
do $$
declare org_id uuid:=gen_random_uuid(); actor_id uuid:=gen_random_uuid(); invoice_id uuid; first_id bigint; claim record; count_before bigint; verified_email text:='portal-fixture-'||replace(gen_random_uuid()::text,'-','')||'@example.test';
begin
  if exists(select 1 from public.platform_settings where key='customer_portal_sync' and value->>'enabled'='true') then raise exception 'Disable the integration before this fixture test'; end if;
  if has_table_privilege('authenticated','public.customer_portal_outbox','SELECT') or has_table_privilege('anon','public.customer_portal_accounts','SELECT') or has_function_privilege('authenticated','public.get_customer_portal_sync_config()','EXECUTE') or has_function_privilege('authenticated','public.claim_customer_portal_events(integer)','EXECUTE') then raise exception 'Client access to private commercial data'; end if;
  select count(*) into count_before from public.customer_portal_outbox;
  insert into public.organizations(id,name) values(org_id,'Portail - entreprise fictive');
  insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,created_at,updated_at) values(actor_id,verified_email,now(),'{"full_name":"Contact fictif"}',now(),now());
  insert into public.users(id,email) values(actor_id,verified_email) on conflict(id) do nothing;
  insert into public.profiles(id,organization_id,email,full_name,role,is_active) values(actor_id,org_id,verified_email,'Contact fictif','admin',true)
    on conflict(id) do update set organization_id=excluded.organization_id,email=excluded.email,full_name=excluded.full_name,role=excluded.role,is_active=true;
  insert into public.subscriptions(organization_id,plan,status,billing_provider) values(org_id,'essential','trialing','qonto')
    on conflict(organization_id) do update set plan='essential',status='trialing',billing_provider='qonto';
  if exists(select 1 from public.customer_portal_outbox where organization_id=org_id) then raise exception 'Trial exported as a purchase'; end if;
  insert into public.billing_requests(organization_id,requested_by,plan,status,qonto_reference,amount_cents,paid_until)
    values(org_id,actor_id,'essential','requested','PORTAL-FIXTURE-'||org_id,4900,now()+interval '1 month') returning id into invoice_id;
  update public.subscriptions set status='active',qonto_reference='PORTAL-FIXTURE-'||org_id,current_period_end=now()+interval '1 month' where organization_id=org_id;
  if exists(select 1 from public.customer_portal_accounts where organization_id=org_id) then raise exception 'An unpaid invoice created a portal account'; end if;
  update public.billing_requests set status='paid' where id=invoice_id;
  if not exists(select 1 from public.customer_portal_accounts where organization_id=org_id and contact_email=verified_email) then raise exception 'Paid invoice did not anchor verified billing contact'; end if;
  if (select count(*) from public.customer_portal_outbox where organization_id=org_id)<>1 then raise exception 'Expected one purchase snapshot'; end if;
  select id into first_id from public.customer_portal_outbox where organization_id=org_id;
  if (select payload#>>'{service,state}' from public.customer_portal_outbox where id=first_id)<>'active' or
     (select payload#>>'{service,amount_cents}' from public.customer_portal_outbox where id=first_id) is not null then raise exception 'Wrong state or invented recurring price'; end if;
  perform public.queue_customer_portal_subscription(org_id);
  if (select count(*) from public.customer_portal_outbox where organization_id=org_id)<>1 then raise exception 'Duplicate snapshot queued'; end if;
  update public.profiles set email='changed@example.test' where id=actor_id;
  update public.subscriptions set status='canceled' where organization_id=org_id;
  if (select count(*) from public.customer_portal_outbox where organization_id=org_id)<>2 or
     (select payload#>>'{company,email}' from public.customer_portal_outbox where organization_id=org_id order by id desc limit 1)<>verified_email then raise exception 'Cancellation or anchored contact failed'; end if;
  select * into claim from public.claim_customer_portal_events(1);
  if claim.id is null then raise exception 'Queue did not issue a lease'; end if;
  if public.finish_customer_portal_event(claim.id,gen_random_uuid(),'sent','') then raise exception 'Wrong lease accepted'; end if;
  if not public.finish_customer_portal_event(claim.id,claim.lease,'retry','portal_unavailable') then raise exception 'Retry acknowledgement failed'; end if;
  if not exists(select 1 from public.customer_portal_outbox where id=claim.id and status='pending' and next_attempt_at>now() and lease is null) then raise exception 'Retry was lost or immediately looped'; end if;
  if (select count(*) from public.customer_portal_outbox)<>count_before+2 then raise exception 'Unexpected changes outside fixture'; end if;
end $$;
select 'PASS: verified purchase, unpaid/trial refusal, deduplication, anchored contact, cancellation, private ACLs and lease retry' as result;
rollback;
