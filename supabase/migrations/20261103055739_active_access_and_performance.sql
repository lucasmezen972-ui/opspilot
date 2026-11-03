-- A suspended/deactivated account must lose API access even with an unexpired JWT.
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path=public,pg_temp as $$
 select organization_id from public.profiles where id=(select auth.uid()) and public.has_active_profile();
$$;
revoke all on function public.current_org_id() from public,anon;
grant execute on function public.current_org_id() to authenticated,service_role;

do $$ declare t record; begin
 for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and c.relrowsecurity loop
  execute format('drop policy if exists active_profile_required on public.%I',t.relname);
  execute format('create policy active_profile_required on public.%I as restrictive for all to authenticated using ((select public.has_active_profile())) with check ((select public.has_active_profile()))',t.relname);
 end loop;
end $$;
drop policy if exists evidence_active_profile on storage.objects;
create policy evidence_active_profile on storage.objects as restrictive for all to authenticated
using (bucket_id not in ('evidence','training-videos') or (select public.has_active_profile()))
with check (bucket_id not in ('evidence','training-videos') or (select public.has_active_profile()));

create or replace function public.guard_profile_authorization()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if current_user in ('anon','authenticated') and (
  new.id is distinct from old.id or new.organization_id is distinct from old.organization_id or new.store_id is distinct from old.store_id or
  new.role is distinct from old.role or new.is_active is distinct from old.is_active or new.email is distinct from old.email or
  new.xp is distinct from old.xp or new.level is distinct from old.level or new.completed_trainings is distinct from old.completed_trainings
 ) then raise exception 'Champs de sécurité et progression du profil protégés' using errcode='42501'; end if;
 return new;
end $$;
revoke all on function public.guard_profile_authorization() from public,anon,authenticated;

-- Cover missing foreign-key prefixes, without adding a second copy of an index.
set lock_timeout='5s';
do $$ declare f record; cols text; begin
 for f in select conrelid,conkey,conname from pg_constraint c join pg_class t on t.oid=c.conrelid
 where c.contype='f' and c.connamespace='public'::regnamespace and t.relkind='r'
 and not exists(select 1 from pg_index i where i.indrelid=c.conrelid and i.indisvalid
  and (select array_agg(x.v order by x.ord) from unnest(i.indkey::smallint[]) with ordinality x(v,ord) where x.ord<=cardinality(c.conkey))=c.conkey) loop
  select string_agg(quote_ident(a.attname),',' order by x.ord) into cols
  from unnest(f.conkey) with ordinality x(attnum,ord) join pg_attribute a on a.attrelid=f.conrelid and a.attnum=x.attnum;
  execute format('create index if not exists %I on %s (%s)','fk_'||substr(md5(f.conrelid::text||f.conname),1,20),f.conrelid::regclass,cols);
 end loop;
end $$;
reset lock_timeout;
notify pgrst,'reload schema';
