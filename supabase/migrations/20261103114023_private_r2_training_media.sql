-- R2 is opt-in. Existing private Supabase objects remain valid.
create table if not exists public.training_r2_uploads (
 id uuid primary key,
 organization_id uuid not null references public.organizations(id),
 actor_id uuid not null references public.profiles(id),
 course_id uuid not null,
 chapter_id uuid not null,
 object_path text not null unique,
 size_bytes bigint not null check(size_bytes between 1 and 262144000),
 status text not null default 'reserved' check(status in ('reserved','ready')),
 created_at timestamptz not null default now(),
 verified_at timestamptz
);
alter table public.training_r2_uploads enable row level security;
revoke all on public.training_r2_uploads from public,anon,authenticated;
grant all on public.training_r2_uploads to service_role;
create index if not exists training_r2_org_idx on public.training_r2_uploads(organization_id);
create index if not exists training_r2_actor_idx on public.training_r2_uploads(actor_id);

create or replace function public.get_training_r2_config()
returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select coalesce((select decrypted_secret::jsonb from vault.decrypted_secrets where name='opspilot_training_r2_v1'),'{}'::jsonb)
 || jsonb_build_object('enabled',coalesce((select (value->>'r2_enabled')::boolean from public.platform_settings where key='training_video_storage'),false));
$$;
revoke all on function public.get_training_r2_config() from public,anon,authenticated;
grant execute on function public.get_training_r2_config() to service_role;

create or replace function public.reserve_training_r2_upload(p_actor_id uuid,p_id uuid,p_course_id uuid,p_chapter_id uuid,p_size bigint)
returns public.training_r2_uploads language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.profiles; existing public.training_r2_uploads; path text;
begin
 select * into actor from public.profiles where id=p_actor_id;
 if actor.id is null or actor.is_active is not true or actor.organization_id is null or actor.role not in ('admin','owner','manager','superadmin')
  or exists(select 1 from public.organizations where id=actor.organization_id and settings->>'status'='suspended') then
  raise exception 'Import interdit' using errcode='42501'; end if;
 if p_id is null or p_course_id is null or p_chapter_id is null or p_size is null or p_size not between 1 and 262144000 then raise exception 'Import invalide'; end if;
 if exists(select 1 from public.trainings where id=p_course_id and organization_id<>actor.organization_id)
  or exists(select 1 from public.training_chapters where id=p_chapter_id and training_id<>p_course_id) then raise exception 'Formation inaccessible' using errcode='42501'; end if;
 -- The budget is global to this dedicated bucket, including abandoned imports.
 -- Never expire a reservation automatically: a lost response may have stored a file.
 perform pg_advisory_xact_lock(hashtextextended('opspilot:r2-storage-budget',0));
 select * into existing from public.training_r2_uploads where id=p_id;
 if found then
  if existing.actor_id<>p_actor_id or existing.organization_id<>actor.organization_id or existing.course_id<>p_course_id or existing.chapter_id<>p_chapter_id or existing.size_bytes<>p_size then raise exception 'Tentative différente' using errcode='42501'; end if;
  return existing;
 end if;
 if (select coalesce(sum(size_bytes),0) from public.training_r2_uploads)+p_size>8000000000 then raise exception 'Espace vidéo disponible épuisé' using errcode='P0001'; end if;
 path:='r2/'||actor.organization_id||'/'||p_course_id||'/'||p_chapter_id||'/'||p_id||'.mp4';
 insert into public.training_r2_uploads(id,organization_id,actor_id,course_id,chapter_id,object_path,size_bytes)
 values(p_id,actor.organization_id,p_actor_id,p_course_id,p_chapter_id,path,p_size) returning * into existing;
 return existing;
end $$;
revoke all on function public.reserve_training_r2_upload(uuid,uuid,uuid,uuid,bigint) from public,anon,authenticated;
grant execute on function public.reserve_training_r2_upload(uuid,uuid,uuid,uuid,bigint) to service_role;

create or replace function public.guard_training_video_path()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.video_storage_path is null then return new; end if;
 if left(new.video_storage_path,3)='r2/' then
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
notify pgrst,'reload schema';
