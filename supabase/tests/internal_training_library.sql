-- Fictional rows, no media byte transfer. Safe rollback on the confirmed project.
begin;
select set_config('opstest.org',gen_random_uuid()::text,true);
select set_config('opstest.other_org',gen_random_uuid()::text,true);
select set_config('opstest.manager',gen_random_uuid()::text,true);
select set_config('opstest.student',gen_random_uuid()::text,true);
select set_config('opstest.other',gen_random_uuid()::text,true);
insert into public.organizations(id,name) values(current_setting('opstest.org')::uuid,'Library fixture A'),(current_setting('opstest.other_org')::uuid,'Library fixture B');
insert into auth.users(id,email) select id,'library-'||id||'@example.invalid' from (values(current_setting('opstest.manager')::uuid),(current_setting('opstest.student')::uuid),(current_setting('opstest.other')::uuid))x(id);
insert into public.profiles(id,email,role,is_active) select id,email,'employé',true from auth.users where id in(current_setting('opstest.manager')::uuid,current_setting('opstest.student')::uuid,current_setting('opstest.other')::uuid) on conflict(id) do nothing;
update public.profiles set organization_id=case when id=current_setting('opstest.other')::uuid then current_setting('opstest.other_org')::uuid else current_setting('opstest.org')::uuid end,
 role=case when id=current_setting('opstest.manager')::uuid then 'manager' else 'employé' end where id in(current_setting('opstest.manager')::uuid,current_setting('opstest.student')::uuid,current_setting('opstest.other')::uuid);
insert into opspilot_private.training_programs(program_key,version,payload,media_manifest,object_path,media_ready_at,assessment_key)
select 'library-integrity-fixture','test',p.payload,p.media_manifest,
 'library/2026-11-03/library-integrity-fixture/'||repeat('a',64)||'.mp4',now(),'[0,0,0,0,0,0]'::jsonb
from opspilot_private.training_programs p where p.program_key='accueil-securite' limit 1;
insert into storage.objects(bucket_id,name) values('training-library','library/2026-11-03/library-integrity-fixture/'||repeat('a',64)||'.mp4');
select set_config('request.jwt.claim.sub',current_setting('opstest.manager'),true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select set_config('opstest.installed',public.install_internal_training_program('library-integrity-fixture','test')::text,true);
do $$ begin
 if public.install_internal_training_program('library-integrity-fixture','test')::text<>current_setting('opstest.installed') then raise exception 'FAIL duplicate installation'; end if;
 if (select count(*) from public.training_chapters where training_id=current_setting('opstest.installed')::uuid)<>3 then raise exception 'FAIL chapter copy'; end if;
 if (select count(*) from public.training_question_bank where training_id=current_setting('opstest.installed')::uuid)<>6 then raise exception 'FAIL bank copy'; end if;
 if public.list_internal_training_programs()::text like '%correct_index%' or public.list_internal_training_programs()::text like '%"quiz":%' then raise exception 'FAIL catalogue leaks answer bank'; end if;
 begin perform payload from opspilot_private.training_programs; raise exception 'FAIL private template exposed'; exception when insufficient_privilege then null; end;
 begin perform public.get_training_media_release(repeat('b',64)); raise exception 'FAIL release job exposed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('opstest.student'),true);
do $$ begin
 if not public.can_read_training_library_object('library/2026-11-03/library-integrity-fixture/'||repeat('a',64)||'.mp4') then raise exception 'FAIL own organisation denied'; end if;
 begin perform public.install_internal_training_program('library-integrity-fixture','test'); raise exception 'FAIL employee installs'; exception when insufficient_privilege then null; end;
 if exists(select 1 from public.training_question_bank where training_id=current_setting('opstest.installed')::uuid and correct_index<>-1) then raise exception 'FAIL copied answers exposed'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('opstest.other'),true);
do $$ begin
 if public.can_read_training_library_object('library/2026-11-03/library-integrity-fixture/'||repeat('a',64)||'.mp4') then raise exception 'FAIL uninstalled cross-organisation media'; end if;
 if exists(select 1 from public.trainings where id=current_setting('opstest.installed')::uuid) then raise exception 'FAIL cross-organisation course'; end if;
end $$;
reset role;
update public.profiles set is_active=false where id=current_setting('opstest.student')::uuid;
select set_config('request.jwt.claim.sub',current_setting('opstest.student'),true);
set local role authenticated;
do $$ begin
 if public.can_read_training_library_object('library/2026-11-03/library-integrity-fixture/'||repeat('a',64)||'.mp4') then raise exception 'FAIL inactive media access'; end if;
 begin perform public.list_internal_training_programs(); raise exception 'FAIL inactive catalogue'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into opspilot_private.training_media_releases(token_hash,program_key,version,expires_at) values(repeat('b',64),'library-integrity-fixture','test',now()-interval '1 minute');
set local role service_role;
do $$ begin
 if public.get_training_media_release(repeat('b',64)) is not null then raise exception 'FAIL expired release'; end if;
 begin perform public.complete_training_media_release(repeat('b',64)); raise exception 'FAIL expired completion'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','public.install_internal_training_program(text,text)','execute') or has_function_privilege('authenticated','public.complete_training_media_release(text)','execute') then raise exception 'FAIL release grants'; end if;
 if (select count(*) from public.trainings where organization_id=current_setting('opstest.org')::uuid)<>1 then raise exception 'FAIL duplicate course'; end if;
 if exists(select 1 from public.user_training_progress where training_id=current_setting('opstest.installed')::uuid) then raise exception 'FAIL manufactured completion'; end if;
end $$;
select 'PASS: library copies, replay protection, private answers, tenant/media isolation, inactive accounts and expiring release' as result;
rollback;
