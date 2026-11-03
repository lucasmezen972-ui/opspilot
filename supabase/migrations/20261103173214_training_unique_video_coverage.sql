-- Separate immutable library versions from manually authored course titles.
-- The Supabase CLI is unavailable in the recovery runtime; the timestamp follows
-- the repository migration format and the SQL is verified by the local runner.
DROP INDEX IF EXISTS public.trainings_organization_title_key;
CREATE UNIQUE INDEX IF NOT EXISTS trainings_manual_title_unique
  ON public.trainings(organization_id,title) WHERE program_key IS NULL;

-- Keep the default-course copier compatible with the partial title index.
CREATE OR REPLACE FUNCTION public.copy_default_trainings(
  target_organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_training public.trainings%ROWTYPE;
  target_training_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations WHERE id = target_organization_id
  ) THEN
    RAISE EXCEPTION 'Organisation introuvable';
  END IF;

  FOR source_training IN
    SELECT *
    FROM public.trainings
    WHERE organization_id =
      '550e8400-e29b-41d4-a716-446655440000'::uuid
      AND is_default = true
      AND organization_id <> target_organization_id
    ORDER BY title
  LOOP
    INSERT INTO public.trainings (
      organization_id,
      title,
      content,
      category,
      difficulty,
      duration_minutes,
      xp_reward,
      is_active,
      is_default,
      ai_generated
    )
    VALUES (
      target_organization_id,
      source_training.title,
      source_training.content,
      source_training.category,
      source_training.difficulty,
      source_training.duration_minutes,
      source_training.xp_reward,
      true,
      false,
      false
    )
    ON CONFLICT (organization_id, title) WHERE program_key IS NULL DO UPDATE SET
      content = EXCLUDED.content,
      category = EXCLUDED.category,
      difficulty = EXCLUDED.difficulty,
      duration_minutes = EXCLUDED.duration_minutes,
      xp_reward = EXCLUDED.xp_reward,
      is_active = true,
      updated_at = now()
    RETURNING id INTO target_training_id;

    INSERT INTO public.training_chapters (
      training_id,
      title,
      body,
      sort_order
    )
    SELECT
      target_training_id,
      chapter.title,
      chapter.body,
      chapter.sort_order
    FROM public.training_chapters chapter
    WHERE chapter.training_id = source_training.id
    ON CONFLICT (training_id, sort_order) DO UPDATE SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      updated_at = now();

    INSERT INTO public.training_quiz_questions (
      training_id,
      question,
      options,
      correct_index,
      sort_order
    )
    SELECT
      target_training_id,
      quiz.question,
      quiz.options,
      quiz.correct_index,
      quiz.sort_order
    FROM public.training_quiz_questions quiz
    WHERE quiz.training_id = source_training.id
    ON CONFLICT (training_id, sort_order) DO UPDATE SET
      question = EXCLUDED.question,
      options = EXCLUDED.options,
      correct_index = EXCLUDED.correct_index,
      updated_at = now();
  END LOOP;
END;
$$;


REVOKE ALL ON FUNCTION public.copy_default_trainings(uuid) FROM PUBLIC,anon,authenticated;

-- New heartbeats keep a union of viewed media intervals, rather than counting
-- the same seconds again on every replay. The JSON is already server-write-only.
-- Legacy totals have no segment history: preserve their existing credit once
-- as [0,watched), without changing completed chapters, scores or attestations.
CREATE OR REPLACE FUNCTION public.record_training_video(p_chapter_id uuid,p_position numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  c public.training_chapters;
  r public.user_training_progress;
  v jsonb;
  coverage nummultirange;
  instant timestamptz;
  elapsed numeric;
  previous_position numeric;
  delta numeric;
  credit numeric;
  watched numeric;
  legacy_seconds numeric;
BEGIN
  SELECT * INTO c FROM public.training_chapters WHERE id=p_chapter_id;
  IF c.id IS NULL OR c.video_duration_seconds IS NULL OR p_position IS NULL
    OR p_position<0 OR p_position>c.video_duration_seconds+1 THEN
    RAISE EXCEPTION 'Lecture invalide';
  END IF;
  PERFORM public.start_training(c.training_id);
  SELECT * INTO r FROM public.user_training_progress
    WHERE user_id=auth.uid() AND training_id=c.training_id FOR UPDATE;
  v:=coalesce(r.video_progress->p_chapter_id::text,'{}'::jsonb);
  instant:=clock_timestamp();
  previous_position:=coalesce((v->>'position')::numeric,p_position);
  elapsed:=greatest(0,extract(epoch FROM instant-coalesce((v->>'last_seen')::timestamptz,instant)));
  delta:=p_position-previous_position;
  legacy_seconds:=greatest(0,least(c.video_duration_seconds,coalesce((v->>'legacy_seconds')::numeric,(v->>'watched')::numeric,0)));
  IF v ? 'covered_ranges' THEN
    coverage:=(v->>'covered_ranges')::nummultirange;
  ELSE
    coverage:=CASE WHEN legacy_seconds>0 THEN nummultirange(numrange(0,legacy_seconds,'[)')) ELSE '{}'::nummultirange END;
  END IF;
  -- A seek, backward jump or rapid/repeated call adds no viewing time. The
  -- sub-second guard prevents immediate requests from collecting clock jitter.
  credit:=CASE WHEN delta BETWEEN 0 AND 15 AND elapsed>=0.5 THEN least(delta,elapsed) ELSE 0 END;
  IF credit>0 AND previous_position<c.video_duration_seconds THEN
    coverage:=coverage+nummultirange(numrange(greatest(0,previous_position),least(c.video_duration_seconds,previous_position+credit),'[)'));
  END IF;
  SELECT coalesce(sum(upper(segment)-lower(segment)),0) INTO watched FROM unnest(coverage) segment;
  v:=jsonb_build_object('position',p_position,'watched',watched,'last_seen',instant,
    'covered_ranges',coverage::text,'legacy_seconds',legacy_seconds);
  UPDATE public.user_training_progress SET
    video_progress=jsonb_set(video_progress,ARRAY[p_chapter_id::text],v),updated_at=instant WHERE id=r.id;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.record_training_video(uuid,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_training_video(uuid,numeric) TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
