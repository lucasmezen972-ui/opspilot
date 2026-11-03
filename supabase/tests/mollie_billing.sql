-- Run as the maintenance role. All fixtures, queued jobs and changes roll back.
begin;
do $$
declare
  actor public.profiles; request_id uuid; other_request uuid;
  quote jsonb; repeated jsonb; payment jsonb; result jsonb; invalid jsonb;
  profile_id text; period_end timestamptz:=now()+interval '1 month';
  payment_id text:='tr_sqlfixture'||replace(gen_random_uuid()::text,'-','');
  refused boolean; original_subscription jsonb; audit_count bigint;
begin
  if has_function_privilege('authenticated','public.get_mollie_billing_config(text)','EXECUTE') or
    has_function_privilege('anon','public.get_mollie_billing_config(text)','EXECUTE') or
    has_function_privilege('authenticated','public.apply_mollie_payment(uuid,jsonb)','EXECUTE') or
    has_function_privilege('authenticated','public.prepare_mollie_payment(uuid,uuid,integer,text,timestamptz,text,text)','EXECUTE') or
    has_table_privilege('authenticated','public.mollie_payment_attempts','SELECT') or
    has_table_privilege('anon','vault.decrypted_secrets','SELECT') or
    has_table_privilege('authenticated','vault.decrypted_secrets','SELECT') then
    raise exception 'Client access to privileged billing operations';
  end if;
  select * into actor from public.profiles where role='superadmin' and is_active is true and organization_id is not null limit 1;
  if not found then raise exception 'Test requires an existing platform owner'; end if;
  select value->>'profile_id' into profile_id from public.platform_settings where key='mollie_billing';
  insert into public.billing_requests(organization_id,requested_by,plan)
    values(actor.organization_id,actor.id,'essential') returning id into request_id;
  quote:=public.prepare_mollie_payment(request_id,actor.id,29900,'SQL-TEST-'||request_id,period_end,'live',profile_id);
  repeated:=public.prepare_mollie_payment(request_id,actor.id,29900,'SQL-TEST-'||request_id,period_end,'live',profile_id);
  if quote->>'id'<>repeated->>'id' then raise exception 'Duplicate quote'; end if;
  refused:=false;
  begin
    perform public.prepare_mollie_payment(request_id,actor.id,100,'SQL-TEST-'||request_id,period_end,'live',profile_id);
  exception when others then refused:=true; end;
  if not refused then raise exception 'Mutable quote accepted'; end if;
  refused:=false;
  begin
    perform public.attach_mollie_payment((quote->>'id')::uuid,payment_id,'https://www.mollie.com.evil.test/checkout/fixture');
  exception when others then refused:=true; end;
  if not refused then raise exception 'Forged checkout destination accepted'; end if;
  perform public.attach_mollie_payment((quote->>'id')::uuid,payment_id,'https://www.mollie.com/checkout/fixture');
  payment:=jsonb_build_object('id',payment_id,'profileId',profile_id,'mode','live','status','open',
    'amount',jsonb_build_object('currency','EUR','value','299.00'),
    'metadata',jsonb_build_object('purpose','opspilot_billing_v1','attempt_id',quote->>'id',
      'request_id',request_id::text,'organization_id',actor.organization_id::text,
      'plan','essential','invoice_reference','SQL-TEST-'||request_id));
  select to_jsonb(s) into original_subscription from public.subscriptions s where organization_id=actor.organization_id;
  result:=public.apply_mollie_payment((quote->>'id')::uuid,payment);
  if (select to_jsonb(s) from public.subscriptions s where organization_id=actor.organization_id) is distinct from original_subscription then
    raise exception 'An unpaid checkout changed a subscription'; end if;
  payment:=payment||jsonb_build_object('status','paid','paidAt',now());
  foreach invalid in array array[
    jsonb_set(payment,'{amount,value}','"2.99"'),
    jsonb_set(payment,'{mode}','"test"'),
    jsonb_set(payment,'{profileId}','"pfl_another"'),
    jsonb_set(payment,'{metadata,organization_id}',to_jsonb(gen_random_uuid()::text)),
    jsonb_set(payment,'{metadata,plan}','"business"'),
    jsonb_set(payment,'{metadata,invoice_reference}','"OTHER"')
  ] loop
    refused:=false;
    begin perform public.apply_mollie_payment((quote->>'id')::uuid,invalid);
    exception when others then refused:=true; end;
    if not refused then raise exception 'Forged payment accepted'; end if;
  end loop;
  result:=public.apply_mollie_payment((quote->>'id')::uuid,payment);
  if not exists(select 1 from public.billing_requests where id=request_id and status='paid') or
    not exists(select 1 from public.subscriptions where organization_id=actor.organization_id and status='active') then
    raise exception 'Verified payment was not applied'; end if;
  select count(*) into audit_count from public.admin_audit_log where action='mollie.payment_confirmed' and target->>'payment_id'=payment_id;
  result:=public.apply_mollie_payment((quote->>'id')::uuid,payment);
  if result->>'activated'<>'false' or (select count(*) from public.admin_audit_log where action='mollie.payment_confirmed' and target->>'payment_id'=payment_id)<>audit_count then
    raise exception 'Duplicate webhook applied twice'; end if;
  result:=public.apply_mollie_payment((quote->>'id')::uuid,payment||jsonb_build_object('status','failed'));
  if not exists(select 1 from public.mollie_payment_attempts where id=(quote->>'id')::uuid and status='paid') then
    raise exception 'Out-of-order event regressed a payment'; end if;
  -- Sandbox receipts must not unlock, renew or change a live subscription.
  insert into public.billing_requests(organization_id,requested_by,plan)
    values(actor.organization_id,actor.id,'essential') returning id into other_request;
  quote:=public.prepare_mollie_payment(other_request,actor.id,100,'SQL-SANDBOX-'||other_request,period_end,'test',profile_id);
  payment_id:='tr_sandbox'||replace(gen_random_uuid()::text,'-','');
  perform public.attach_mollie_payment((quote->>'id')::uuid,payment_id,'https://www.mollie.com/checkout/fixture');
  select to_jsonb(s) into original_subscription from public.subscriptions s where organization_id=actor.organization_id;
  payment:=jsonb_build_object('id',payment_id,'profileId',profile_id,'mode','test','status','paid','paidAt',now(),
    'amount',jsonb_build_object('currency','EUR','value','1.00'),
    'metadata',jsonb_build_object('purpose','opspilot_billing_v1','attempt_id',quote->>'id',
      'request_id',other_request::text,'organization_id',actor.organization_id::text,
      'plan','essential','invoice_reference','SQL-SANDBOX-'||other_request));
  result:=public.apply_mollie_payment((quote->>'id')::uuid,payment);
  if result->>'activated'<>'false' or
    (select to_jsonb(s) from public.subscriptions s where organization_id=actor.organization_id) is distinct from original_subscription or
    not exists(select 1 from public.billing_requests where id=other_request and status='requested' and payment_url is null) then
    raise exception 'Sandbox payment affected live billing'; end if;
end;
$$;
select 'PASS: billing isolation, immutable quotes, payment integrity, idempotency and sandbox separation' as result;
rollback;
