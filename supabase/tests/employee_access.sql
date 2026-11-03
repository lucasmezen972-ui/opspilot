begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='employé' limit 1),true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $test$ begin
 if public.is_backoffice_operator() then raise exception 'FAIL employee platform access'; end if;
 begin update public.profiles set organization_id=gen_random_uuid() where id=auth.uid(); raise exception 'FAIL tenant reassignment'; exception when insufficient_privilege then null; end;
 begin perform public.update_team_member_role(auth.uid(),'superadmin'); raise exception 'FAIL role management bypass'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.platform_settings; raise exception 'FAIL secret exposure'; exception when insufficient_privilege then null; end;
end $test$;
select 'PASS: employee cannot reassign tenant, promote a role or read settings' as result;
rollback;
