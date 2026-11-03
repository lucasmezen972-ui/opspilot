-- Run against a disposable database or in this rolled-back transaction.
-- Uses two existing active colleagues from different organisations; no email is sent.
begin;
select set_config('opstest.actor',(select id::text from public.profiles where is_active and role in ('employé','employee','stagiaire') and organization_id is not null limit 1),true);
select set_config('opstest.org',(select organization_id::text from public.profiles where id=current_setting('opstest.actor')::uuid),true);
select set_config('opstest.other',(select id::text from public.profiles where is_active and organization_id<>current_setting('opstest.org')::uuid limit 1),true);
select set_config('opstest.course',gen_random_uuid()::text,true);
select set_config('opstest.chapter',gen_random_uuid()::text,true);
select set_config('opstest.video',gen_random_uuid()::text,true);
select set_config('opstest.xp',(select coalesce(xp,0)::text from public.profiles where id=current_setting('opstest.actor')::uuid),true);
do $$ begin
 if nullif(current_setting('opstest.actor'),'') is null or nullif(current_setting('opstest.other'),'') is null then raise exception 'Two active test actors in different organisations are required'; end if;
 insert into public.trainings(id,organization_id,title,category,difficulty,duration_minutes,xp_reward,is_active,min_score)
 values(current_setting('opstest.course')::uuid,current_setting('opstest.org')::uuid,'SQL integrity fixture','Test','beginner',1,20,true,70);
 insert into public.training_chapters(id,training_id,title,body,sort_order) values(current_setting('opstest.chapter')::uuid,current_setting('opstest.course')::uuid,'Lecture','Contenu de contrôle',0);
 insert into public.training_chapters(id,training_id,title,body,sort_order,video_url,video_duration_seconds) values(current_setting('opstest.video')::uuid,current_setting('opstest.course')::uuid,'Vidéo de contrôle','Fixture temporaire',1,'https://example.invalid/integrity.mp4',100);
 insert into public.training_quiz_questions(training_id,question,options,correct_index,sort_order) values(current_setting('opstest.course')::uuid,'Contrôle','["A","B"]',1,0);
end $$;
select set_config('request.jwt.claim.sub',current_setting('opstest.actor'),true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ begin
 begin update public.profiles set xp=999999 where id=auth.uid(); raise exception 'FAIL self-awarded XP'; exception when insufficient_privilege then null; end;
 begin insert into public.user_training_progress(user_id,training_id,status,score) values(auth.uid(),current_setting('opstest.course')::uuid,'completed',100); raise exception 'FAIL forged result'; exception when insufficient_privilege then null; end;
 begin perform correct_index from public.training_quiz_questions; raise exception 'FAIL answer key exposure'; exception when insufficient_privilege then null; end;
 begin perform public.issue_training_certificate(current_setting('opstest.course')::uuid,'{"fullName":"Test","employeeId":"TEST"}'); raise exception 'FAIL attestation without assessment'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
 if exists(select 1 from public.training_question_bank where correct_index<>-1) then raise exception 'FAIL public answer key'; end if;
end $$;
select public.mark_training_chapter(current_setting('opstest.course')::uuid,current_setting('opstest.chapter')::uuid);
-- A seek and rapidly repeated calls cannot manufacture watched time.
select public.record_training_video(current_setting('opstest.video')::uuid,99);
do $$ begin
 begin perform public.mark_training_chapter(current_setting('opstest.course')::uuid,current_setting('opstest.video')::uuid); raise exception 'FAIL skipped video'; exception when raise_exception then if sqlerrm like 'FAIL%' then raise; end if; end;
end $$;
select public.record_training_video(current_setting('opstest.video')::uuid,0);
select public.record_training_video(current_setting('opstest.video')::uuid,10);
do $$ begin
 if (select (video_progress#>>array[current_setting('opstest.video'),'watched'])::numeric from public.user_training_progress where user_id=auth.uid() and training_id=current_setting('opstest.course')::uuid)<>0 then raise exception 'FAIL rapid video calls credited'; end if;
end $$;
reset role;
-- Advance the clock fixture, instead of waiting through a real lesson in SQL.
update public.user_training_progress set video_progress=jsonb_set(video_progress,array[current_setting('opstest.video')],jsonb_build_object('position',10,'watched',80,'last_seen',now()-interval '10 seconds')) where user_id=current_setting('opstest.actor')::uuid and training_id=current_setting('opstest.course')::uuid;
set local role authenticated;
select public.record_training_video(current_setting('opstest.video')::uuid,20);
select public.mark_training_chapter(current_setting('opstest.course')::uuid,current_setting('opstest.video')::uuid);
select set_config('opstest.session',public.start_training_quiz(current_setting('opstest.course')::uuid)->>'id',true);
reset role;
select set_config('opstest.answers',(select jsonb_agg(q->'correct_index' order by ord)::text from opspilot_private.training_quiz_sessions s,jsonb_array_elements(s.questions) with ordinality x(q,ord) where s.id=current_setting('opstest.session')::uuid),true);
set local role authenticated;
select set_config('opstest.result',public.submit_training_quiz(current_setting('opstest.session')::uuid,current_setting('opstest.answers')::jsonb)::text,true);
-- A duplicate webhook/click must not award XP again.
select public.submit_training_quiz(current_setting('opstest.session')::uuid,current_setting('opstest.answers')::jsonb);
do $$ begin
 if (current_setting('opstest.result')::jsonb->>'score')::integer<>100 or (current_setting('opstest.result')::jsonb->>'passed')::boolean is not true then raise exception 'FAIL server score'; end if;
 if (select xp from public.profiles where id=auth.uid())<>current_setting('opstest.xp')::integer+20 then raise exception 'FAIL XP duplicated'; end if;
end $$;
select public.issue_training_certificate(current_setting('opstest.course')::uuid,'{"fullName":"SQL Test","employeeId":"TEST","position":"Test","store":"Test"}');
select set_config('request.jwt.claim.sub',current_setting('opstest.other'),true);
do $$ begin
 begin perform public.start_training(current_setting('opstest.course')::uuid); raise exception 'FAIL cross-tenant course'; exception when insufficient_privilege then null; end;
 begin perform public.submit_training_quiz(current_setting('opstest.session')::uuid,'[1]'); raise exception 'FAIL stolen session'; exception when insufficient_privilege then null; end;
 if exists(select 1 from public.training_certificates where training_id=current_setting('opstest.course')::uuid) then raise exception 'FAIL cross-tenant attestation'; end if;
end $$;
reset role;
-- An organisation suspension applies to an already-issued access token.
update public.organizations set settings=coalesce(settings,'{}')||'{"status":"suspended"}'::jsonb where id=current_setting('opstest.org')::uuid;
select set_config('request.jwt.claim.sub',current_setting('opstest.actor'),true);
set local role authenticated;
do $$ begin
 if public.has_active_profile() or exists(select 1 from public.trainings) then raise exception 'FAIL suspended organisation access'; end if;
end $$;
reset role;
update public.organizations set settings=settings-'status' where id=current_setting('opstest.org')::uuid;
-- Deactivation must work even if the old access token has not expired.
update public.profiles set is_active=false where id=current_setting('opstest.actor')::uuid;
select set_config('request.jwt.claim.sub',current_setting('opstest.actor'),true);
set local role authenticated;
do $$ begin
 if public.has_active_profile() or exists(select 1 from public.trainings) then raise exception 'FAIL deactivated account can read'; end if;
 begin perform public.start_training(current_setting('opstest.course')::uuid); raise exception 'FAIL inactive RPC'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: server grading, answer secrecy, one-time XP, tenant isolation, attestation and deactivation' as result;
rollback;
