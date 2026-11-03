-- Disposable local fixture only. No Qonto invoice or Mollie payment is created.
begin;
insert into public.billing_requests(id,organization_id,requested_by,plan) values('30000000-0000-4000-a000-000000000091','10000000-0000-4000-a000-000000000002','20000000-0000-4000-a000-000000000002','business');
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000004',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select public.confirm_qonto_payment('30000000-0000-4000-a000-000000000091','TEST-MANUAL-PLAN',now()+interval '30 days');
reset role;
do $$ begin
 if (select subscription_plan from public.organizations where id='10000000-0000-4000-a000-000000000002')<>'pro' then raise exception 'FAIL Qonto Business mapping'; end if;
 if (select plan from public.subscriptions where organization_id='10000000-0000-4000-a000-000000000002')<>'business' then raise exception 'FAIL Qonto subscription'; end if;
end $$;
-- Catching up an older invoice must not shorten a newer paid period or plan.
insert into public.billing_requests(id,organization_id,requested_by,plan) values('30000000-0000-4000-a000-000000000092','10000000-0000-4000-a000-000000000002','20000000-0000-4000-a000-000000000002','essential');
set local role authenticated;
select public.confirm_qonto_payment('30000000-0000-4000-a000-000000000092','TEST-OLDER-INVOICE',now()+interval '10 days');
reset role;
do $$ begin
 if (select plan from public.subscriptions where organization_id='10000000-0000-4000-a000-000000000002')<>'business' then raise exception 'FAIL older invoice downgraded plan'; end if;
 if (select current_period_end from public.subscriptions where organization_id='10000000-0000-4000-a000-000000000002')<now()+interval '29 days' then raise exception 'FAIL older invoice shortened access'; end if;
end $$;
rollback;
