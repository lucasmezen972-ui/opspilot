-- Local disposable fixture only: storage metadata, no actual media upload.
begin;
select set_config('opstest.video_course',gen_random_uuid()::text,true);
select set_config('opstest.video_chapter',gen_random_uuid()::text,true);
select set_config('opstest.video_path','10000000-0000-4000-a000-000000000001/'||current_setting('opstest.video_course')||'/'||current_setting('opstest.video_chapter')||'/fixture.mp4',true);
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ begin
 begin insert into storage.objects(bucket_id,name) values('training-videos',current_setting('opstest.video_path')); raise exception 'FAIL employee upload'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000003',true);
set local role authenticated;
insert into storage.objects(bucket_id,name) values('training-videos',current_setting('opstest.video_path'));
select set_config('opstest.video_payload',jsonb_build_object('course_title','SQL video fixture','title','SQL chapter','body','Contrôle technique temporaire','video_storage_path',current_setting('opstest.video_path'),'video_duration_seconds',6,'question','Question de contrôle','options','["Oui","Non"]'::jsonb,'correct_index',0)::text,true);
select public.save_training_video_lesson(current_setting('opstest.video_course')::uuid,current_setting('opstest.video_chapter')::uuid,true,current_setting('opstest.video_payload')::jsonb);
select public.save_training_video_lesson(current_setting('opstest.video_course')::uuid,current_setting('opstest.video_chapter')::uuid,true,current_setting('opstest.video_payload')::jsonb);
do $$ begin
 if (select count(*) from public.training_chapters where training_id=current_setting('opstest.video_course')::uuid)<>1 then raise exception 'FAIL replay created second video'; end if;
 if (select count(*) from public.training_quiz_questions where training_id=current_setting('opstest.video_course')::uuid)<>1 then raise exception 'FAIL replay created second question'; end if;
 if not exists(select 1 from storage.objects where name=current_setting('opstest.video_path')) then raise exception 'FAIL own manager cannot read video'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000002',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from storage.objects where name=current_setting('opstest.video_path')) then raise exception 'FAIL cross-tenant video read'; end if;
 begin insert into storage.objects(bucket_id,name) values('training-videos',current_setting('opstest.video_path')||'other'); raise exception 'FAIL cross-tenant video upload'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
