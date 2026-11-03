-- Disposable fixture only: users use .invalid addresses. No email/provider calls.
begin;
insert into auth.users(id,email) values('20000000-0000-4000-a000-000000000099','new-account@example.invalid');
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000099',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select set_config('opstest.new_org',(public.create_organization('New account fixture','New store fixture')->>'organization_id'),true);
do $$ begin
 if public.create_organization('Repeated request',null)->>'organization_id'<>current_setting('opstest.new_org') then raise exception 'FAIL duplicate organisation on replay'; end if;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.subscriptions where organization_id=current_setting('opstest.new_org')::uuid)<>1 then raise exception 'FAIL initial subscription'; end if;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ declare response jsonb; begin
 response:=public.create_organization('Attempt to replace employer',null);
 if response->>'organization_id'<>'10000000-0000-4000-a000-000000000001' or response->>'role'<>'employé' then raise exception 'FAIL employee reassigned'; end if;
end $$;
reset role;
insert into public.invitations(organization_id,email,role,token) values('10000000-0000-4000-a000-000000000002','student-a@example.invalid','admin','40000000-0000-4000-a000-000000000001');
set local role authenticated;
do $$ begin
 begin perform public.accept_invitation('40000000-0000-4000-a000-000000000001'); raise exception 'FAIL existing employee moved'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.profiles set is_active=false where id='20000000-0000-4000-a000-000000000001';
set local role authenticated;
do $$ begin
 begin perform public.create_organization('New trial',null); raise exception 'FAIL deactivated bootstrap'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000003',true);
update public.organizations set settings='{"status":"suspended"}' where id='10000000-0000-4000-a000-000000000001';
set local role authenticated;
do $$ begin
 begin perform public.apply_onboarding_configuration('Test','[]'); raise exception 'FAIL suspended manager RPC'; exception when insufficient_privilege then null; end;
 begin perform public.deactivate_team_member('20000000-0000-4000-a000-000000000001'); raise exception 'FAIL suspended manager deactivation'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: onboarding idempotence, no cross-organisation reassignment, inactive and suspended RPC rejection' as result;
rollback;
