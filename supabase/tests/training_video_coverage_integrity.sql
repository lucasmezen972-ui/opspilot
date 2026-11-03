-- Fictional rows only; server clock fixtures replace real waiting. Always rollback.
BEGIN;
SELECT set_config('coverage.org',gen_random_uuid()::text,true);
SELECT set_config('coverage.actor',gen_random_uuid()::text,true);
SELECT set_config('coverage.course',gen_random_uuid()::text,true);
SELECT set_config('coverage.chapter',gen_random_uuid()::text,true);
SELECT set_config('coverage.legacy',gen_random_uuid()::text,true);
INSERT INTO public.organizations(id,name) VALUES(current_setting('coverage.org')::uuid,'Video coverage fixture');
INSERT INTO auth.users(id,email) VALUES(current_setting('coverage.actor')::uuid,'coverage-'||current_setting('coverage.actor')||'@example.invalid');
INSERT INTO public.profiles(id,email,role,is_active)
SELECT id,email,'employé',true FROM auth.users WHERE id=current_setting('coverage.actor')::uuid ON CONFLICT(id) DO NOTHING;
UPDATE public.profiles SET organization_id=current_setting('coverage.org')::uuid WHERE id=current_setting('coverage.actor')::uuid;
INSERT INTO public.trainings(id,organization_id,title,is_active)
VALUES(current_setting('coverage.course')::uuid,current_setting('coverage.org')::uuid,'Coverage fixture',true);
INSERT INTO public.training_chapters(id,training_id,title,body,sort_order,video_url,video_duration_seconds) VALUES
(current_setting('coverage.chapter')::uuid,current_setting('coverage.course')::uuid,'Unique coverage','Fictitious',0,'https://example.invalid/coverage.mp4',100),
(current_setting('coverage.legacy')::uuid,current_setting('coverage.course')::uuid,'Legacy progress','Fictitious',1,'https://example.invalid/legacy.mp4',100);
SELECT set_config('request.jwt.claim.sub',current_setting('coverage.actor'),true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
SELECT public.record_training_video(current_setting('coverage.chapter')::uuid,0);
RESET ROLE;
DO $$
DECLARE
  chapter uuid:=current_setting('coverage.chapter')::uuid;
  course uuid:=current_setting('coverage.course')::uuid;
  actor uuid:=current_setting('coverage.actor')::uuid;
  result jsonb;
BEGIN
  UPDATE public.user_training_progress SET video_progress=jsonb_set(video_progress,ARRAY[chapter::text,'last_seen'],to_jsonb(clock_timestamp()-interval '10 seconds')) WHERE user_id=actor AND training_id=course;
  result:=public.record_training_video(chapter,10);
  IF (result->>'watched')::numeric<>10 THEN RAISE EXCEPTION 'FAIL first real segment'; END IF;
  -- Ten full replays of the same first ten seconds must still cover ten seconds.
  FOR i IN 1..10 LOOP
    PERFORM public.record_training_video(chapter,0);
    UPDATE public.user_training_progress SET video_progress=jsonb_set(video_progress,ARRAY[chapter::text,'last_seen'],to_jsonb(clock_timestamp()-interval '10 seconds')) WHERE user_id=actor AND training_id=course;
    result:=public.record_training_video(chapter,10);
    IF (result->>'watched')::numeric<>10 THEN RAISE EXCEPTION 'FAIL replay manufactured unique viewing'; END IF;
  END LOOP;
  BEGIN
    PERFORM public.mark_training_chapter(course,chapter);
    RAISE EXCEPTION 'FAIL replay unlocked chapter';
  EXCEPTION WHEN raise_exception THEN IF sqlerrm LIKE 'FAIL%' THEN RAISE; END IF; END;
  -- Five immediately repeated calls cannot credit new media positions.
  FOR i IN 11..15 LOOP result:=public.record_training_video(chapter,i); END LOOP;
  IF (result->>'watched')::numeric<>10 THEN RAISE EXCEPTION 'FAIL rapid calls credited'; END IF;
  -- Real time bounds the credit even when the position advances faster.
  PERFORM public.record_training_video(chapter,20);
  UPDATE public.user_training_progress SET video_progress=jsonb_set(video_progress,ARRAY[chapter::text,'last_seen'],to_jsonb(clock_timestamp()-interval '2 seconds')) WHERE user_id=actor AND training_id=course;
  result:=public.record_training_video(chapter,30);
  IF (result->>'watched')::numeric NOT BETWEEN 12 AND 12.1 THEN RAISE EXCEPTION 'FAIL playback exceeded real elapsed time'; END IF;
  UPDATE public.user_training_progress SET video_progress=jsonb_set(video_progress,ARRAY[chapter::text,'last_seen'],to_jsonb(clock_timestamp()-interval '60 seconds')) WHERE user_id=actor AND training_id=course;
  result:=public.record_training_video(chapter,90);
  IF (result->>'watched')::numeric>=12.1 THEN RAISE EXCEPTION 'FAIL large seek credited'; END IF;
  -- Fill the genuinely new intervals; overlap with the short credited segment
  -- is merged rather than counted again.
  PERFORM public.record_training_video(chapter,10);
  FOR i IN 2..9 LOOP
    UPDATE public.user_training_progress SET video_progress=jsonb_set(video_progress,ARRAY[chapter::text,'last_seen'],to_jsonb(clock_timestamp()-interval '10 seconds')) WHERE user_id=actor AND training_id=course;
    result:=public.record_training_video(chapter,i*10);
  END LOOP;
  IF (result->>'watched')::numeric<>90 THEN RAISE EXCEPTION 'FAIL distinct segments not merged exactly'; END IF;
  PERFORM public.mark_training_chapter(course,chapter);
  result:=public.record_training_video(chapter,90);
  IF (result->>'watched')::numeric<>90 THEN RAISE EXCEPTION 'FAIL duplicate heartbeat changed coverage'; END IF;
END $$;
-- Existing aggregate-only progress is preserved once, then gains unique coverage.
UPDATE public.user_training_progress SET video_progress=jsonb_set(video_progress,ARRAY[current_setting('coverage.legacy')],jsonb_build_object('position',80,'watched',80,'last_seen',clock_timestamp()-interval '10 seconds'))
WHERE user_id=current_setting('coverage.actor')::uuid AND training_id=current_setting('coverage.course')::uuid;
SET LOCAL ROLE authenticated;
DO $$ DECLARE result jsonb; BEGIN
  result:=public.record_training_video(current_setting('coverage.legacy')::uuid,90);
  IF (result->>'watched')::numeric<>90 OR (result->>'legacy_seconds')::numeric<>80 THEN RAISE EXCEPTION 'FAIL legacy progress lost'; END IF;
  IF NOT current_setting('coverage.chapter')::uuid=ANY((SELECT completed_chapter_ids FROM public.user_training_progress WHERE user_id=auth.uid() AND training_id=current_setting('coverage.course')::uuid)::uuid[]) THEN RAISE EXCEPTION 'FAIL completed chapter changed'; END IF;
  BEGIN
    UPDATE public.user_training_progress SET video_progress='{}' WHERE user_id=auth.uid();
    RAISE EXCEPTION 'FAIL client can forge coverage';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'PASS: unique media coverage, overlap/replay, elapsed time, seeking, legacy progress and server-only writes' AS result;
ROLLBACK;
