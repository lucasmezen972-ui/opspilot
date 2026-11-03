-- Curated learning programs: immutable versions, opt-in per organisation.
-- Existing courses, progress, XP and attestations are intentionally preserved.
create schema if not exists opspilot_private;
create table if not exists opspilot_private.training_programs (
  program_key text not null check (program_key ~ '^[a-z0-9-]{1,64}$'),
  version text not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  media_manifest jsonb not null,
  object_path text not null unique,
  media_ready_at timestamptz,
  assessment_key jsonb check (assessment_key is null or jsonb_typeof(assessment_key)='array'),
  primary key(program_key,version)
);
alter table opspilot_private.training_programs enable row level security;
revoke all on opspilot_private.training_programs from public,anon,authenticated;

alter table public.trainings add column if not exists program_key text;
alter table public.trainings add column if not exists program_version text;
alter table public.trainings add column if not exists program_metadata jsonb;
create unique index if not exists trainings_program_version_unique
  on public.trainings(organization_id,program_key,program_version)
  where program_key is not null;
create index if not exists training_chapters_library_path_idx
  on public.training_chapters(video_storage_path) where video_storage_path like 'library/%';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('training-library','training-library',false,52428800,array['video/mp4'])
on conflict(id) do update set public=false,file_size_limit=52428800,allowed_mime_types=array['video/mp4'];

create or replace function opspilot_private.training_program_metadata(p jsonb,m jsonb)
returns jsonb language sql immutable set search_path=pg_catalog as $$
 select jsonb_build_object(
  'key',p->'key','version',p->'version','title',p->'title','category',p->'category',
  'summary',p->'summary','audience',p->'audience','prerequisites',p->'prerequisites',
  'requirement',p->'requirement','applicability',p->'applicability','onsite',p->'onsite',
  'objectives',p->'objectives','positioning',coalesce(p->'positioning','[]'::jsonb),
  'reading_minutes',p->'reading_minutes','activity_minutes',p->'activity_minutes',
  'sources',p->'sources','video_seconds',m->'duration_seconds','video_chapters',m->'chapters',
  'narration','synthetic','voice_model_card',m->'voice_model_card',
  'chapter_count',jsonb_array_length(p->'chapters'),'quiz_count',jsonb_array_length(p->'quiz'));
$$;
revoke all on function opspilot_private.training_program_metadata(jsonb,jsonb) from public,anon,authenticated;

create or replace function public.list_internal_training_programs()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not public.has_active_profile() then raise exception 'Connexion requise' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(opspilot_private.training_program_metadata(payload,media_manifest)
  order by case payload->>'requirement' when 'internal_required' then 0 when 'role_required' then 1 else 2 end,program_key),'[]'::jsonb)
  from opspilot_private.training_programs where media_ready_at is not null and assessment_key is not null);
end $$;
revoke all on function public.list_internal_training_programs() from public,anon;
grant execute on function public.list_internal_training_programs() to authenticated;

create or replace function public.can_read_training_library_object(p_name text)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select public.has_active_profile() and exists(
  select 1 from public.training_chapters c join public.trainings t on t.id=c.training_id
  join public.profiles p on p.organization_id=t.organization_id
  where p.id=auth.uid() and t.is_active and c.video_storage_path=p_name
   and p_name like 'library/%');
$$;
revoke all on function public.can_read_training_library_object(text) from public,anon;
grant execute on function public.can_read_training_library_object(text) to authenticated;
drop policy if exists training_library_read on storage.objects;
create policy training_library_read on storage.objects for select to authenticated
using(bucket_id='training-library' and public.can_read_training_library_object(name));

create or replace function public.guard_training_video_path()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.video_storage_path is null then return new; end if;
 if left(new.video_storage_path,8)='library/' then
  if not exists(select 1 from opspilot_private.training_programs p join public.trainings t
    on t.program_key=p.program_key and t.program_version=p.version
    where t.id=new.training_id and p.object_path=new.video_storage_path and p.media_ready_at is not null)
   or not exists(select 1 from storage.objects where bucket_id='training-library' and name=new.video_storage_path)
  then raise exception 'Vidéo du parcours non vérifiée'; end if;
 elsif left(new.video_storage_path,3)='r2/' then
  if not exists(select 1 from public.training_r2_uploads u join public.trainings t on t.id=u.course_id
   where u.object_path=new.video_storage_path and u.status='ready' and u.verified_at is not null
    and u.organization_id=t.organization_id and u.course_id=new.training_id and u.chapter_id=new.id) then
   raise exception 'Import vidéo privé non vérifié ou hors de la formation'; end if;
 else
  if not exists(select 1 from public.trainings t where t.id=new.training_id and split_part(new.video_storage_path,'/',1)=t.organization_id::text and split_part(new.video_storage_path,'/',2)=t.id::text) then raise exception 'Vidéo hors de la formation'; end if;
  if not exists(select 1 from storage.objects where bucket_id='training-videos' and name=new.video_storage_path) then raise exception 'Importez le fichier avant de publier le chapitre'; end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_training_video_path() from public,anon,authenticated;

create or replace function opspilot_private.install_training_program(p_key text,p_version text,p_org uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v opspilot_private.training_programs; course_id uuid; part jsonb; q jsonb; n integer:=0;
begin
 if not exists(select 1 from public.organizations where id=p_org and coalesce(settings->>'status','active')<>'suspended') then
  raise exception 'Organisation indisponible' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('training-program:'||p_org::text||':'||p_key||':'||p_version,0));
 select id into course_id from public.trainings where organization_id=p_org and program_key=p_key and program_version=p_version;
 if found then return course_id; end if;
 select * into v from opspilot_private.training_programs where program_key=p_key and version=p_version and media_ready_at is not null and assessment_key is not null;
 if not found then raise exception 'Parcours indisponible'; end if;
 if jsonb_array_length(v.assessment_key)<>jsonb_array_length(v.payload->'quiz') then raise exception 'Évaluation indisponible'; end if;
 if not exists(select 1 from storage.objects where bucket_id='training-library' and name=v.object_path) then raise exception 'Vidéo indisponible'; end if;
 insert into public.trainings(organization_id,title,content,category,difficulty,duration_minutes,xp_reward,is_active,min_score,ai_generated,is_default,program_key,program_version,program_metadata)
 values(p_org,v.payload->>'title',v.payload->>'summary',v.payload->>'category','beginner',
  ceil((v.media_manifest->>'duration_seconds')::numeric/60)::int+(v.payload->>'reading_minutes')::int+(v.payload->>'activity_minutes')::int,
  30,true,80,true,false,p_key,p_version,opspilot_private.training_program_metadata(v.payload,v.media_manifest)) returning id into course_id;
 for part in select value from jsonb_array_elements(v.payload->'chapters') loop
  insert into public.training_chapters(training_id,title,body,sort_order,video_storage_path,video_duration_seconds)
  values(course_id,part->>'title',part->>'body',n+1,case when n=0 then v.object_path end,
   case when n=0 then ceil((v.media_manifest->>'duration_seconds')::numeric)::int end);
  n:=n+1;
 end loop;
 n:=0;
 for q in select value from jsonb_array_elements(v.payload->'quiz') loop
  insert into public.training_quiz_questions(training_id,question,options,correct_index,sort_order,difficulty,question_type,is_critical)
  values(course_id,q->>'question',q->'options',(v.assessment_key->>n)::int,n+1,'medium',q->>'question_type',(q->>'is_critical')::boolean);
  n:=n+1;
 end loop;
 return course_id;
end $$;
revoke all on function opspilot_private.install_training_program(text,text,uuid) from public,anon,authenticated;

create or replace function public.install_internal_training_program(p_key text,p_version text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.profiles;
begin
 if not public.has_active_profile() then raise exception 'Compte indisponible' using errcode='42501'; end if;
 select * into actor from public.profiles where id=auth.uid();
 if actor.organization_id is null or actor.role not in ('admin','owner','manager','superadmin') then
  raise exception 'Ajout réservé aux responsables' using errcode='42501'; end if;
 return opspilot_private.install_training_program(p_key,p_version,actor.organization_id);
end $$;
revoke all on function public.install_internal_training_program(text,text) from public,anon;
grant execute on function public.install_internal_training_program(text,text) to authenticated;

-- Release capability: one fixed immutable media object, hash and size, short expiry.
-- No user token or existing provider secret is exported to the publishing client.
create table if not exists opspilot_private.training_media_releases(
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
 program_key text not null,version text not null,
 expires_at timestamptz not null,
 completed_at timestamptz,
 foreign key(program_key,version) references opspilot_private.training_programs(program_key,version)
);
alter table opspilot_private.training_media_releases enable row level security;
revoke all on opspilot_private.training_media_releases from public,anon,authenticated;
create or replace function public.get_training_media_release(p_token_hash text)
returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('path',p.object_path,'sha256',p.media_manifest->'sha256',
  'size_bytes',p.media_manifest->'size_bytes','complete',r.completed_at is not null)
 from opspilot_private.training_media_releases r join opspilot_private.training_programs p
 on p.program_key=r.program_key and p.version=r.version
 where r.token_hash=p_token_hash and r.expires_at>now();
$$;
create or replace function public.complete_training_media_release(p_token_hash text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r opspilot_private.training_media_releases;
begin
 select * into r from opspilot_private.training_media_releases where token_hash=p_token_hash and expires_at>now() for update;
 if not found then raise exception 'Release unavailable' using errcode='42501'; end if;
 update opspilot_private.training_programs set media_ready_at=coalesce(media_ready_at,now()) where program_key=r.program_key and version=r.version;
 update opspilot_private.training_media_releases set completed_at=coalesce(completed_at,now()) where token_hash=p_token_hash;
end $$;
revoke all on function public.get_training_media_release(text) from public,anon,authenticated;
revoke all on function public.complete_training_media_release(text) from public,anon,authenticated;
grant execute on function public.get_training_media_release(text) to service_role;
grant execute on function public.complete_training_media_release(text) to service_role;
notify pgrst,'reload schema';
