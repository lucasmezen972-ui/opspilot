-- CURRENT_TIME is a SQL keyword (timetz), even inside PL/pgSQL. Use an
-- unambiguous timestamptz variable and qualify the existing RPC arguments.
create or replace function public.check_ai_rate_limit(rate_key text,max_requests integer,window_seconds integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare
 v_window timestamptz;
 v_count integer;
 v_now timestamptz:=clock_timestamp();
begin
 if rate_key is null or length(rate_key)=0 or max_requests is null or
  max_requests<=0 or window_seconds is null or window_seconds<=0 then
  return false;
 end if;
 insert into public.ai_rate_limits(rate_key,window_started_at,request_count,updated_at)
 values(check_ai_rate_limit.rate_key,v_now,0,v_now)
 on conflict on constraint ai_rate_limits_pkey do nothing;
 select r.window_started_at,r.request_count into v_window,v_count
 from public.ai_rate_limits r where r.rate_key=check_ai_rate_limit.rate_key for update;
 -- Take the time after the row lock, including time spent waiting for it.
 v_now:=clock_timestamp();
 if v_now>=v_window+make_interval(secs=>window_seconds) then
  update public.ai_rate_limits r set window_started_at=v_now,request_count=1,updated_at=v_now
  where r.rate_key=check_ai_rate_limit.rate_key;
  return true;
 end if;
 if v_count>=max_requests then return false; end if;
 update public.ai_rate_limits r set request_count=r.request_count+1,updated_at=v_now
 where r.rate_key=check_ai_rate_limit.rate_key;
 return true;
end $$;
revoke all on function public.check_ai_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.check_ai_rate_limit(text,integer,integer) to service_role;
notify pgrst,'reload schema';
