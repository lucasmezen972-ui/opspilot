begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='admin' limit 1),true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $test$ begin
  if public.is_backoffice_operator() then raise exception 'FAIL admin platform access'; end if;
  begin perform public.superadmin_organizations(); raise exception 'FAIL portfolio exposed'; exception when insufficient_privilege then null; end;
  begin perform public.superadmin_set_organization_status(gen_random_uuid(),'suspended'); raise exception 'FAIL status mutation allowed'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.platform_settings limit 1; raise exception 'FAIL settings exposed'; exception when insufficient_privilege then null; end;
  begin update public.profiles set role='superadmin' where id=auth.uid(); raise exception 'FAIL self promotion'; exception when insufficient_privilege then null; end;
  begin update public.profiles set organization_id=(select organization_id from public.profiles where id=auth.uid()) where id=auth.uid(); exception when insufficient_privilege then raise exception 'FAIL harmless profile update'; end;
  if exists (select 1 from public.audits where organization_id<>public.current_org_id()) then raise exception 'FAIL other tenant audits'; end if;
end $test$;
select 'PASS: tenant admin blocked from platform, secrets and self promotion; tenant isolation maintained' as result;
rollback;
