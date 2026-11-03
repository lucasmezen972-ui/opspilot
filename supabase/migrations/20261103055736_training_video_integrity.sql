-- Video lessons stay private. Assessment results and awards are server-owned.
create schema if not exists opspilot_private;
revoke all on schema opspilot_private from public,anon,authenticated;
grant usage on schema opspilot_private to service_role;

create or replace function public.has_active_profile()
returns boolean language sql stable security definer set search_path=public,pg_temp
as $$ select exists(select 1 from public.profiles p left join public.organizations o on o.id=p.organization_id
  where p.id=(select auth.uid()) and p.is_active is true
  and (p.role in ('superadmin','support') or coalesce(o.settings->>'status','active')<>'suspended')); $$;
revoke all on function public.has_active_profile() from public,anon;
grant execute on function public.has_active_profile() to authenticated,service_role;

alter table public.training_chapters add column if not exists video_url text;
alter table public.training_chapters add column if not exists video_storage_path text;
alter table public.training_chapters add column if not exists video_duration_seconds integer;
alter table public.training_chapters add column if not exists captions_url text;
alter table public.training_quiz_questions add column if not exists correct_indexes integer[];
alter table public.user_training_progress add column if not exists video_progress jsonb not null default '{}';
alter table public.user_training_progress add column if not exists server_verified_at timestamptz;
alter table public.training_certificates add column if not exists employee_id text;
alter table public.training_certificates add column if not exists position text;
alter table public.training_certificates add column if not exists store_name text;
alter table public.training_certificates add column if not exists category text;
alter table public.training_certificates add column if not exists duration_minutes integer;
alter table public.training_certificates add column if not exists quiz_version text;
alter table public.training_certificates add column if not exists attempt_number integer;
alter table public.training_certificates add column if not exists status text default 'validé';
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.training_chapters'::regclass and conname='training_video_source_valid') then
    alter table public.training_chapters add constraint training_video_source_valid check (
      (video_url is null or (length(video_url)<=2048 and video_url ~ '^https://[^/@[:space:]]+[^[:space:]]*[.]mp4([?][^[:space:]]*)?$'))
      and not(video_url is not null and video_storage_path is not null)
      and (video_duration_seconds is null or video_duration_seconds between 1 and 7200)
      and ((video_url is null and video_storage_path is null) or video_duration_seconds is not null)
      and (captions_url is null or (length(captions_url)<=2048 and captions_url ~ '^https://[^/@[:space:]]+[^[:space:]]*[.]vtt([?][^[:space:]]*)?$')));
  end if;
end $$;

-- Remove the permissive legacy course-writing policies (all colleagues could edit).
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='trainings' and cmd in ('INSERT','UPDATE','DELETE','ALL') loop
    execute format('drop policy %I on public.trainings',p.policyname);
  end loop;
end $$;
drop policy if exists training_manage on public.trainings;
create policy training_manage on public.trainings for all to authenticated
using (organization_id=public.current_org_id() and exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('admin','owner','manager','superadmin')))
with check (organization_id=public.current_org_id() and exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('admin','owner','manager','superadmin')));

-- Do not publish answer keys through REST, including to a colleague editing a URL.
revoke select on public.training_quiz_questions from public,anon,authenticated;
grant select(id,training_id,question,options,sort_order,difficulty,question_type,is_critical,created_at,updated_at)
  on public.training_quiz_questions to authenticated;
create or replace view public.training_question_bank with (security_invoker=true) as
  select id,training_id,question,options,sort_order,difficulty,question_type,is_critical,
    -1 as correct_index, null::integer[] as correct_indexes
  from public.training_quiz_questions;
revoke all on public.training_question_bank from public,anon;
grant select on public.training_question_bank to authenticated;

-- No client can forge progress, insert an attestation or award their own XP.
revoke insert,update,delete on public.user_training_progress from public,anon,authenticated;
revoke insert,update,delete on public.training_certificates from public,anon,authenticated;
drop policy if exists "Managers can read org certificates" on public.training_certificates;
drop policy if exists training_managers_read_certificates on public.training_certificates;
create policy training_managers_read_certificates on public.training_certificates for select to authenticated
using (organization_id=public.current_org_id() and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','owner','manager','superadmin')));

create table if not exists opspilot_private.training_quiz_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 training_id uuid not null references public.trainings(id) on delete cascade, questions jsonb not null,
 min_score integer not null, created_at timestamptz not null default now(),
 submitted_at timestamptz, result jsonb
);
create index if not exists training_quiz_sessions_actor on opspilot_private.training_quiz_sessions(user_id,training_id,created_at);
create index if not exists training_quiz_sessions_course on opspilot_private.training_quiz_sessions(training_id);
alter table opspilot_private.training_quiz_sessions enable row level security;
revoke all on opspilot_private.training_quiz_sessions from public,anon,authenticated;
grant all on opspilot_private.training_quiz_sessions to service_role;

create or replace function public.start_training(p_training_id uuid)
returns public.user_training_progress language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.user_training_progress;
begin
 if not public.has_active_profile() or not exists(select 1 from public.trainings where id=p_training_id and organization_id=public.current_org_id() and is_active) then
   raise exception 'Formation inaccessible' using errcode='42501'; end if;
 insert into public.user_training_progress(user_id,training_id,status,progress_percentage,completed_chapter_ids,started_at)
 values(auth.uid(),p_training_id,'in_progress',0,'{}',now()) on conflict(user_id,training_id) do nothing;
 select * into r from public.user_training_progress where user_id=auth.uid() and training_id=p_training_id;
 return r;
end $$;

create or replace function public.record_training_video(p_chapter_id uuid,p_position numeric)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.training_chapters; r public.user_training_progress; v jsonb; elapsed numeric; delta numeric; watched numeric;
begin
 select * into c from public.training_chapters where id=p_chapter_id;
 if c.id is null or c.video_duration_seconds is null or p_position is null or p_position<0 or p_position>c.video_duration_seconds+1 then raise exception 'Lecture invalide'; end if;
 perform public.start_training(c.training_id);
 select * into r from public.user_training_progress where user_id=auth.uid() and training_id=c.training_id for update;
 v:=coalesce(r.video_progress->p_chapter_id::text,'{}');
 elapsed:=greatest(0,extract(epoch from now()-coalesce((v->>'last_seen')::timestamptz,now())));
 delta:=p_position-coalesce((v->>'position')::numeric,p_position);
 -- Seeking does not credit the skipped section; only bounded playback ticks count.
 watched:=least(c.video_duration_seconds,coalesce((v->>'watched')::numeric,0)+case when delta between 0 and 15 then least(delta,elapsed) else 0 end);
 v:=jsonb_build_object('position',p_position,'watched',watched,'last_seen',now());
 update public.user_training_progress set video_progress=jsonb_set(video_progress,array[p_chapter_id::text],v),updated_at=now() where id=r.id;
 return v;
end $$;

create or replace function public.mark_training_chapter(p_training_id uuid,p_chapter_id uuid)
returns public.user_training_progress language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.training_chapters; r public.user_training_progress; ids uuid[]; total integer;
begin
 perform public.start_training(p_training_id);
 select * into c from public.training_chapters where id=p_chapter_id and training_id=p_training_id;
 if c.id is null then raise exception 'Chapitre inaccessible' using errcode='42501'; end if;
 select * into r from public.user_training_progress where user_id=auth.uid() and training_id=p_training_id for update;
 if c.video_duration_seconds is not null and coalesce((r.video_progress#>>array[p_chapter_id::text,'watched'])::numeric,0)<c.video_duration_seconds*0.9 then
  raise exception 'Regardez au moins 90 %% de la vidéo avant de valider ce chapitre'; end if;
 select coalesce(array_agg(distinct x),'{}') into ids from unnest(coalesce(r.completed_chapter_ids,'{}')||array[p_chapter_id]) x
   where x in (select id from public.training_chapters where training_id=p_training_id);
 select count(*) into total from public.training_chapters where training_id=p_training_id;
 update public.user_training_progress set completed_chapter_ids=ids,
  progress_percentage=case when status='completed' then 100 else least(90,round(cardinality(ids)*90.0/greatest(total,1))) end,updated_at=now()
 where id=r.id returning * into r;
 return r;
end $$;

create or replace function public.start_training_quiz(p_training_id uuid)
returns jsonb language plpgsql security definer set search_path=public,opspilot_private,pg_temp as $$
declare r public.user_training_progress; t public.trainings; bank jsonb; exposed jsonb; sid uuid; n integer;
begin
 r:=public.start_training(p_training_id);
 select * into t from public.trainings where id=p_training_id;
 if not exists(select 1 from public.training_chapters where training_id=t.id) or exists(select 1 from public.training_chapters c where c.training_id=t.id and not c.id=any(coalesce(r.completed_chapter_ids,'{}'))) then
  raise exception 'Terminez les chapitres avant le quiz'; end if;
 if (select count(*) from opspilot_private.training_quiz_sessions where user_id=auth.uid() and training_id=t.id and created_at>now()-interval '1 day')>=10 then
  raise exception 'Limite de dix tentatives par jour atteinte'; end if;
 select count(*) into n from public.training_quiz_questions where training_id=t.id;
 if n=0 then raise exception 'Aucune question disponible'; end if;
 select jsonb_agg(to_jsonb(q)) into bank from (select * from public.training_quiz_questions where training_id=t.id order by random()
  limit case when n>=50 then 25 when n>=15 then 15 else 8 end) q;
 insert into opspilot_private.training_quiz_sessions(user_id,training_id,questions,min_score)
 values(auth.uid(),t.id,bank,coalesce(t.min_score,70)) returning id into sid;
 select jsonb_agg(jsonb_build_object('id',q->>'id','question',q->>'question','options',q->'options','question_type',coalesce(q->>'question_type','qcm_single'),
  'difficulty',coalesce(q->>'difficulty','easy'),'is_critical',coalesce((q->>'is_critical')::boolean,false),
  'correctAnswerIndex',-1,'correctAnswerIndexes','[]'::jsonb)) into exposed from jsonb_array_elements(bank) q;
 return jsonb_build_object('id',sid,'questions',exposed,'bankSize',n,'drawn',jsonb_array_length(bank));
end $$;

create or replace function public.submit_training_quiz(p_session_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public,opspilot_private,pg_temp as $$
declare s opspilot_private.training_quiz_sessions; r public.user_training_progress; t public.trainings;
 q jsonb; a jsonb; i integer:=0; correct integer:=0; fc boolean:=false; ok boolean; v_score integer; passed boolean; verified_before boolean;
 expected integer[]; given integer[];
begin
 if not public.has_active_profile() then raise exception 'Accès refusé' using errcode='42501'; end if;
 select * into s from opspilot_private.training_quiz_sessions where id=p_session_id and user_id=auth.uid() for update;
 if not found or not exists(select 1 from public.trainings where id=s.training_id and organization_id=public.current_org_id() and is_active) then raise exception 'Tentative inaccessible' using errcode='42501'; end if;
 if s.submitted_at is not null then return s.result; end if;
 if s.created_at<now()-interval '2 hours' or jsonb_typeof(p_answers) is distinct from 'array' or jsonb_array_length(p_answers)<>jsonb_array_length(s.questions) then raise exception 'Tentative expirée ou réponses incomplètes'; end if;
 for q in select * from jsonb_array_elements(s.questions) loop
  a:=p_answers->i; i:=i+1;
  if jsonb_typeof(a)='number' and a::text ~ '^[0-9]+$' then given:=array[(a::text)::integer];
  elsif jsonb_typeof(a)='array' and jsonb_array_length(a) between 1 and 12 and not exists(select 1 from jsonb_array_elements(a) x where jsonb_typeof(x)<>'number' or x::text !~ '^[0-9]+$') then
   select array_agg((x::text)::integer order by (x::text)::integer) into given from jsonb_array_elements(a) x;
  else raise exception 'Réponse invalide'; end if;
  if exists(select 1 from unnest(given) x where x<0 or x>=jsonb_array_length(q->'options')) or cardinality(given)<>(select count(distinct x) from unnest(given) x) then raise exception 'Choix invalide'; end if;
  if q->>'question_type'='qcm_multi' and jsonb_typeof(q->'correct_indexes')='array' then
   select array_agg((x::text)::integer order by (x::text)::integer) into expected from jsonb_array_elements(q->'correct_indexes') x;
  else expected:=array[(q->>'correct_index')::integer]; end if;
  ok:=given=expected;
  if ok then correct:=correct+1; elsif coalesce((q->>'is_critical')::boolean,false) or q->>'question_type'='critical' then fc:=true; end if;
 end loop;
 v_score:=round(correct*100.0/i); passed:=v_score>=s.min_score and not fc;
 select * into t from public.trainings where id=s.training_id;
 select * into r from public.user_training_progress where user_id=auth.uid() and training_id=t.id for update;
 verified_before:=r.server_verified_at is not null and r.status='completed';
 if passed and not verified_before and r.status<>'completed' then
  update public.profiles set xp=coalesce(xp,0)+t.xp_reward,level=floor((coalesce(xp,0)+t.xp_reward)/100.0)+1,
   completed_trainings=coalesce(completed_trainings,0)+1 where id=auth.uid();
 end if;
 update public.user_training_progress set score=case when verified_before then greatest(coalesce(r.score,0),v_score) else v_score end,
  status=case when passed or verified_before then 'completed' else 'in_progress' end,
  progress_percentage=case when passed or verified_before then 100 else 90 end,
  completed_at=case when passed or verified_before then coalesce(r.completed_at,now()) else null end,
  server_verified_at=case when passed or verified_before then now() else null end,updated_at=now() where id=r.id returning * into r;
 update opspilot_private.training_quiz_sessions set submitted_at=now(), result=jsonb_build_object('score',v_score,'failedCritical',fc,'passed',passed,'data',to_jsonb(r)) where id=s.id returning result into s.result;
 return s.result;
end $$;

create or replace function public.issue_training_certificate(p_training_id uuid,p_identity jsonb)
returns public.training_certificates language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.profiles; t public.trainings; r public.user_training_progress; c public.training_certificates;
begin
 if not public.has_active_profile() then raise exception 'Accès refusé' using errcode='42501'; end if;
 select * into p from public.profiles where id=auth.uid();
 perform pg_advisory_xact_lock(hashtextextended('training-cert:'||p.id::text||':'||p_training_id::text,0));
 select * into t from public.trainings where id=p_training_id and organization_id=p.organization_id and is_active;
 select * into r from public.user_training_progress where training_id=t.id and user_id=p.id and status='completed' and server_verified_at is not null;
 if t.id is null or r.id is null then raise exception 'Réussissez l’évaluation avant de demander l’attestation'; end if;
 if nullif(trim(p_identity->>'fullName'),'') is null or nullif(trim(p_identity->>'employeeId'),'') is null or
  length(p_identity->>'fullName')>200 or length(p_identity->>'employeeId')>100 or length(p_identity->>'position')>200 or length(p_identity->>'store')>200 then raise exception 'Identité invalide'; end if;
 select * into c from public.training_certificates where user_id=p.id and training_id=t.id order by issued_at desc limit 1;
 if found then
  update public.training_certificates set full_name=trim(p_identity->>'fullName'),score=r.score,issued_at=now(),
   employee_id=trim(p_identity->>'employeeId'),position=trim(p_identity->>'position'),store_name=trim(p_identity->>'store'),
   quiz_version='SERVER-1',status='validé' where id=c.id returning * into c;
 else
  insert into public.training_certificates(user_id,training_id,organization_id,full_name,training_title,score,issued_at,certificate_number,employee_id,position,store_name,category,duration_minutes,quiz_version,attempt_number,status)
  values(p.id,t.id,p.organization_id,trim(p_identity->>'fullName'),t.title,r.score,now(),'OP-'||upper(replace(gen_random_uuid()::text,'-','')),
   trim(p_identity->>'employeeId'),trim(p_identity->>'position'),trim(p_identity->>'store'),t.category,t.duration_minutes,
   'SERVER-1',(select count(*) from opspilot_private.training_quiz_sessions where user_id=p.id and training_id=t.id and submitted_at is not null),'validé') returning * into c;
 end if;
 return c;
end $$;

do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
  and p.proname in ('start_training','record_training_video','mark_training_chapter','start_training_quiz','submit_training_quiz','issue_training_certificate') loop
  execute format('revoke all on function %s from public,anon',f.signature);
  execute format('grant execute on function %s to authenticated,service_role',f.signature);
 end loop;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('training-videos','training-videos',false,52428800,array['video/mp4'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists training_video_read on storage.objects;
create policy training_video_read on storage.objects for select to authenticated using (
 bucket_id='training-videos' and (storage.foldername(name))[1]=public.current_org_id()::text
 and public.has_active_profile() and exists(select 1 from public.training_chapters c join public.trainings t on t.id=c.training_id
 where c.video_storage_path=name and t.organization_id=public.current_org_id() and t.is_active));
drop policy if exists training_video_manage on storage.objects;
create policy training_video_manage on storage.objects for all to authenticated using (
 bucket_id='training-videos' and (storage.foldername(name))[1]=public.current_org_id()::text
 and public.has_active_profile() and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','owner','manager','superadmin')))
with check (bucket_id='training-videos' and (storage.foldername(name))[1]=public.current_org_id()::text
 and public.has_active_profile() and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','owner','manager','superadmin'))
 and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$');

create or replace function public.save_training_video_lesson(p_course_id uuid,p_chapter_id uuid,p_new_course boolean,p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.profiles; duration integer; c public.training_chapters;
begin
 select * into actor from public.profiles where id=auth.uid();
 if not public.has_active_profile() or actor.role not in ('admin','owner','manager','superadmin') then raise exception 'Droits insuffisants' using errcode='42501'; end if;
 duration:=(p_payload->>'video_duration_seconds')::integer;
 if p_new_course is null or p_course_id is null or p_chapter_id is null or jsonb_typeof(p_payload) is distinct from 'object'
  or nullif(trim(p_payload->>'title'),'') is null or length(p_payload->>'title')>200 or length(p_payload->>'body')>50000
  or duration is null or duration not between 1 and 7200 or
  ((nullif(p_payload->>'video_url','') is null)=(nullif(p_payload->>'video_storage_path','') is null)) then raise exception 'Contenu vidéo invalide'; end if;
 if p_new_course then
  perform pg_advisory_xact_lock(hashtextextended('video-course:'||p_course_id::text,0));
  if exists(select 1 from public.trainings where id=p_course_id) then
   if exists(select 1 from public.training_chapters existing_chapter join public.trainings t on t.id=existing_chapter.training_id where existing_chapter.id=p_chapter_id and existing_chapter.training_id=p_course_id and t.organization_id=actor.organization_id
    and existing_chapter.title=trim(p_payload->>'title') and existing_chapter.body=coalesce(p_payload->>'body','') and existing_chapter.video_url is not distinct from nullif(p_payload->>'video_url','') and existing_chapter.video_storage_path is not distinct from nullif(p_payload->>'video_storage_path','') and existing_chapter.video_duration_seconds=duration) then return p_chapter_id; end if;
   raise exception 'Une publication existe déjà pour cette tentative. Actualisez le catalogue';
  end if;
  if nullif(trim(p_payload->>'course_title'),'') is null or length(p_payload->>'course_title')>200 or
   nullif(trim(p_payload->>'question'),'') is null or length(p_payload->>'question')>2000 or
   jsonb_typeof(p_payload->'options') is distinct from 'array' or jsonb_array_length(p_payload->'options')<>2 or
   (p_payload->>'correct_index')::integer not between 0 and 1 or
   exists(select 1 from jsonb_array_elements(p_payload->'options') x where jsonb_typeof(x)<>'string' or length(x#>>'{}') not between 1 and 1000) then raise exception 'Question finale invalide'; end if;
  insert into public.trainings(id,organization_id,title,content,category,difficulty,duration_minutes,xp_reward,is_active,min_score)
  values(p_course_id,actor.organization_id,trim(p_payload->>'course_title'),p_payload->>'body','Formation vidéo','beginner',ceil(duration/60.0),20,true,70);
  insert into public.training_quiz_questions(training_id,question,options,correct_index,sort_order)
  values(p_course_id,trim(p_payload->>'question'),p_payload->'options',(p_payload->>'correct_index')::integer,0);
 elsif not exists(select 1 from public.trainings where id=p_course_id and organization_id=actor.organization_id) then raise exception 'Formation inaccessible' using errcode='42501'; end if;
 -- Serialize chapter ordering and retries for this course.
 perform 1 from public.trainings where id=p_course_id for update;
 select * into c from public.training_chapters where id=p_chapter_id;
 if found and c.training_id<>p_course_id then raise exception 'Chapitre inaccessible' using errcode='42501'; end if;
 insert into public.training_chapters(id,training_id,title,body,sort_order,video_url,video_storage_path,video_duration_seconds,captions_url)
 values(p_chapter_id,p_course_id,trim(p_payload->>'title'),coalesce(p_payload->>'body',''),
  (select coalesce(max(sort_order),-1)+1 from public.training_chapters where training_id=p_course_id),
  nullif(p_payload->>'video_url',''),nullif(p_payload->>'video_storage_path',''),duration,nullif(p_payload->>'captions_url',''))
 on conflict(id) do update set title=excluded.title,body=excluded.body,video_url=excluded.video_url,video_storage_path=excluded.video_storage_path,
 video_duration_seconds=excluded.video_duration_seconds,captions_url=excluded.captions_url,updated_at=now();
 update public.trainings set duration_minutes=greatest(duration_minutes,ceil((select coalesce(sum(video_duration_seconds),0) from public.training_chapters where training_id=p_course_id)/60.0)),updated_at=now() where id=p_course_id;
 return p_chapter_id;
end $$;
revoke all on function public.save_training_video_lesson(uuid,uuid,boolean,jsonb) from public,anon;
grant execute on function public.save_training_video_lesson(uuid,uuid,boolean,jsonb) to authenticated,service_role;

create or replace function public.guard_training_video_path()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.video_storage_path is not null and not exists(select 1 from public.trainings t where t.id=new.training_id
  and split_part(new.video_storage_path,'/',1)=t.organization_id::text and split_part(new.video_storage_path,'/',2)=t.id::text) then raise exception 'Vidéo hors de la formation'; end if;
 if new.video_storage_path is not null and not exists(select 1 from storage.objects where bucket_id='training-videos' and name=new.video_storage_path) then raise exception 'Importez le fichier avant de publier le chapitre'; end if;
 return new;
end $$;
revoke all on function public.guard_training_video_path() from public,anon,authenticated;
drop trigger if exists guard_training_video_path on public.training_chapters;
create trigger guard_training_video_path before insert or update on public.training_chapters for each row execute function public.guard_training_video_path();
notify pgrst,'reload schema';
