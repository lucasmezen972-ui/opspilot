-- Disposable local fixture ONLY. Simulated provider JSON; no Mollie/Qonto call.
begin;
insert into public.platform_settings(key,value) values('mollie_billing','{"profile_id":"pfl_fixture","enabled":false}') on conflict(key) do update set value=excluded.value;
update public.profiles set role='admin' where id='20000000-0000-4000-a000-000000000001';
insert into public.billing_requests(id,organization_id,requested_by,plan) values
 ('30000000-0000-4000-a000-000000000001','10000000-0000-4000-a000-000000000001','20000000-0000-4000-a000-000000000001','business'),
 ('30000000-0000-4000-a000-000000000002','10000000-0000-4000-a000-000000000002','20000000-0000-4000-a000-000000000002','essential');
select set_config('opstest.sepa', (public.prepare_sepa_agreement('20000000-0000-4000-a000-000000000004','30000000-0000-4000-a000-000000000001',19900,'TEST-SEPA-01',current_date+interval '30 days 23 hours 59 minutes 59 seconds',1,'live','pfl_fixture')).id::text,true);
do $$ begin
 if (select status from public.billing_requests where id='30000000-0000-4000-a000-000000000001')<>'requested' then raise exception 'FAIL quote started payment'; end if;
 begin perform public.reserve_billing_invoice('live','TEST-SEPA-01','30000000-0000-4000-a000-000000000002','qonto'); raise exception 'FAIL duplicate invoice'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
 begin update public.billing_requests set qonto_reference='TEST-SEPA-01',payment_url='https://pay.qonto.com/fixture',status='awaiting_payment' where id='30000000-0000-4000-a000-000000000001'; raise exception 'FAIL second payment channel'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ begin
 begin perform public.apply_sepa_payment(current_setting('opstest.sepa')::uuid,'{}'); raise exception 'FAIL client payment confirmation'; exception when insufficient_privilege then null; end;
 begin perform public.get_mollie_recurring_config('live'); raise exception 'FAIL client secret read'; exception when insufficient_privilege then null; end;
 if jsonb_array_length(public.get_sepa_agreements())<>1 then raise exception 'FAIL own agreement invisible'; end if;
end $$;
reset role;
select public.consent_sepa_agreement('20000000-0000-4000-a000-000000000001',current_setting('opstest.sepa')::uuid);
update public.mollie_recurring_agreements set customer_id='cst_fixture',first_payment_id='tr_firstfixture',provider_subscription_id='sub_fixture' where id=current_setting('opstest.sepa')::uuid;
select set_config('opstest.payment',jsonb_build_object('id','tr_firstfixture','profileId','pfl_fixture','mode','live','customerId','cst_fixture','sequenceType','first','amount',jsonb_build_object('currency','EUR','value','199.00'),'status','paid','paidAt',now(),'metadata',jsonb_build_object('purpose','opspilot_sepa_v1','agreement_id',current_setting('opstest.sepa')))::text,true);
do $$ begin
 begin perform public.apply_sepa_payment(current_setting('opstest.sepa')::uuid,jsonb_set(current_setting('opstest.payment')::jsonb,'{amount,value}','"1.00"')); raise exception 'FAIL mismatched amount'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
end $$;
select public.apply_sepa_payment(current_setting('opstest.sepa')::uuid,current_setting('opstest.payment')::jsonb);
select public.apply_sepa_payment(current_setting('opstest.sepa')::uuid,current_setting('opstest.payment')::jsonb);
do $$ begin
 if (select count(*) from public.mollie_recurring_payments where agreement_id=current_setting('opstest.sepa')::uuid)<>1 then raise exception 'FAIL payment duplicated'; end if;
 if (select subscription_plan from public.organizations where id='10000000-0000-4000-a000-000000000001')<>'pro' then raise exception 'FAIL paid plan mapping'; end if;
 if (select plan from public.subscriptions where organization_id='10000000-0000-4000-a000-000000000001')<>'business' then raise exception 'FAIL subscription not active'; end if;
end $$;
-- An automatic renewal has no invented service period or invoice reference.
select set_config('opstest.renewal', (current_setting('opstest.payment')::jsonb || jsonb_build_object('id','tr_cyclefixture','sequenceType','recurring','subscriptionId','sub_fixture','method','directdebit','createdAt',now()))::text,true);
select public.apply_sepa_payment(current_setting('opstest.sepa')::uuid,current_setting('opstest.renewal')::jsonb);
do $$ begin
 if (select period_end from public.mollie_recurring_payments where payment_id='tr_cyclefixture') is not null then raise exception 'FAIL invented invoice period'; end if;
 if (select mollie_payment_id from public.subscriptions where organization_id='10000000-0000-4000-a000-000000000001')<>'tr_firstfixture' then raise exception 'FAIL unreconciled renewal activated'; end if;
end $$;
select public.reconcile_sepa_invoice('20000000-0000-4000-a000-000000000004',current_setting('opstest.sepa')::uuid,'tr_cyclefixture','TEST-SEPA-02',current_date+interval '60 days');
do $$ begin
 if (select mollie_payment_id from public.subscriptions where organization_id='10000000-0000-4000-a000-000000000001')<>'tr_cyclefixture' then raise exception 'FAIL renewal reconciliation'; end if;
end $$;
-- A chargeback stops the calendar for review, without trusting the webhook body.
select public.apply_sepa_payment(current_setting('opstest.sepa')::uuid,current_setting('opstest.renewal')::jsonb||'{"amountChargedBack":{"value":"199.00"}}');
do $$ begin
 if (select status from public.mollie_recurring_agreements where id=current_setting('opstest.sepa')::uuid)<>'needs_review' then raise exception 'FAIL chargeback ignored'; end if;
end $$;
-- Test mode never grants a production subscription.
select set_config('opstest.testsepa',(public.prepare_sepa_agreement('20000000-0000-4000-a000-000000000004','30000000-0000-4000-a000-000000000002',19900,'TEST-SEPA-SIMULATION',current_date+interval '30 days',1,'test','pfl_fixture')).id::text,true);
update public.mollie_recurring_agreements set consented_at=now(),customer_id='cst_testfixture',first_payment_id='tr_testfixture' where id=current_setting('opstest.testsepa')::uuid;
update public.organizations set subscription_plan='basic' where id='10000000-0000-4000-a000-000000000002';
select public.apply_sepa_payment(current_setting('opstest.testsepa')::uuid,current_setting('opstest.payment')::jsonb||jsonb_build_object('id','tr_testfixture','mode','test','customerId','cst_testfixture','metadata',jsonb_build_object('purpose','opspilot_sepa_v1','agreement_id',current_setting('opstest.testsepa'))));
do $$ begin
 if (select subscription_plan from public.organizations where id='10000000-0000-4000-a000-000000000002')<>'basic' then raise exception 'FAIL test payment changed live plan'; end if;
end $$;
rollback;
