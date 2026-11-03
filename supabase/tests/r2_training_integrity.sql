-- Disposable fixture only. No provider or customer operation.
begin;
select set_config('opstest.r2_id',gen_random_uuid()::text,true);
select set_config('opstest.r2_course',gen_random_uuid()::text,true);
select set_config('opstest.r2_chapter',gen_random_uuid()::text,true);
set local role service_role;
select public.reserve_training_r2_upload('20000000-0000-4000-a000-000000000003',current_setting('opstest.r2_id')::uuid,current_setting('opstest.r2_course')::uuid,current_setting('opstest.r2_chapter')::uuid,1024);
select public.reserve_training_r2_upload('20000000-0000-4000-a000-000000000003',current_setting('opstest.r2_id')::uuid,current_setting('opstest.r2_course')::uuid,current_setting('opstest.r2_chapter')::uuid,1024);
do $$ begin
 if (select count(*) from public.training_r2_uploads)<>1 then raise exception 'FAIL replay reserved twice'; end if;
 begin perform public.reserve_training_r2_upload('20000000-0000-4000-a000-000000000003',current_setting('opstest.r2_id')::uuid,current_setting('opstest.r2_course')::uuid,current_setting('opstest.r2_chapter')::uuid,2048); raise exception 'FAIL changed reservation'; exception when insufficient_privilege then null; end;
 begin perform public.reserve_training_r2_upload('20000000-0000-4000-a000-000000000001',gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),1024); raise exception 'FAIL employee reservation'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('opstest.r2_path',(select object_path from public.training_r2_uploads where id=current_setting('opstest.r2_id')::uuid),true);
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000003',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('opstest.r2_payload',jsonb_build_object('course_title','R2 fixture','title','R2 private chapter','body','Temporary fixture','video_storage_path',current_setting('opstest.r2_path'),'video_duration_seconds',6,'question','Fixture?','options','["Oui","Non"]'::jsonb,'correct_index',0)::text,true);
set local role authenticated;
do $$ begin
 begin perform * from public.training_r2_uploads; raise exception 'FAIL registry leak'; exception when insufficient_privilege then null; end;
 begin perform public.get_training_r2_config(); raise exception 'FAIL credential RPC'; exception when insufficient_privilege then null; end;
 begin perform public.reserve_training_r2_upload(auth.uid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),1024); raise exception 'FAIL direct reservation'; exception when insufficient_privilege then null; end;
 begin perform public.save_training_video_lesson(current_setting('opstest.r2_course')::uuid,current_setting('opstest.r2_chapter')::uuid,true,current_setting('opstest.r2_payload')::jsonb); raise exception 'FAIL unverified video published'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
end $$;
reset role;
update public.training_r2_uploads set status='ready',verified_at=now() where id=current_setting('opstest.r2_id')::uuid;
set local role authenticated;
select public.save_training_video_lesson(current_setting('opstest.r2_course')::uuid,current_setting('opstest.r2_chapter')::uuid,true,current_setting('opstest.r2_payload')::jsonb);
select public.save_training_video_lesson(current_setting('opstest.r2_course')::uuid,current_setting('opstest.r2_chapter')::uuid,true,current_setting('opstest.r2_payload')::jsonb);
do $$ begin
 begin insert into public.training_chapters(id,training_id,title,body,sort_order,video_storage_path,video_duration_seconds)
 values(gen_random_uuid(),current_setting('opstest.r2_course')::uuid,'Stolen object','',1,current_setting('opstest.r2_path'),6); raise exception 'FAIL object reused on another chapter'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-4000-a000-000000000002',true);
do $$ begin
 if exists(select 1 from public.training_chapters where id=current_setting('opstest.r2_chapter')::uuid) then raise exception 'FAIL cross-tenant chapter'; end if;
end $$;
reset role;
set local role service_role;
do $$ begin
 for i in 1..30 loop
  perform public.reserve_training_r2_upload('20000000-0000-4000-a000-000000000003',gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),262144000);
 end loop;
 begin perform public.reserve_training_r2_upload('20000000-0000-4000-a000-000000000003',gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),262144000); raise exception 'FAIL storage cap'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
end $$;
reset role;
select 'PASS: R2 reservation, replay, server verification, tenant binding and storage cap' as result;
rollback;
