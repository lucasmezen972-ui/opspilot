-- Safe for the deployed project: one random key, no user or provider call,
-- and all counter changes rolled back.
begin;
select set_config('opstest.rate_key','opspilot-integrity-rate-'||gen_random_uuid()::text,true);
set local role service_role;
do $$ begin
 if public.check_ai_rate_limit(current_setting('opstest.rate_key'),2,60) is not true then raise exception 'FAIL first request denied'; end if;
 if public.check_ai_rate_limit(current_setting('opstest.rate_key'),2,60) is not true then raise exception 'FAIL second request denied'; end if;
 if public.check_ai_rate_limit(current_setting('opstest.rate_key'),2,60) is not false then raise exception 'FAIL rate limit bypass'; end if;
 if public.check_ai_rate_limit(null,2,60) is not false or public.check_ai_rate_limit('',2,60) is not false
  or public.check_ai_rate_limit(current_setting('opstest.rate_key'),null,60) is not false
  or public.check_ai_rate_limit(current_setting('opstest.rate_key'),2,0) is not false then raise exception 'FAIL invalid limits accepted'; end if;
end $$;
reset role;
update public.ai_rate_limits set window_started_at=clock_timestamp()-interval '61 seconds'
 where rate_key=current_setting('opstest.rate_key');
set local role service_role;
do $$ begin
 if public.check_ai_rate_limit(current_setting('opstest.rate_key'),2,60) is not true then raise exception 'FAIL window did not reset'; end if;
end $$;
reset role;
do $$ begin
 if (select request_count from public.ai_rate_limits where rate_key=current_setting('opstest.rate_key'))<>1 then raise exception 'FAIL reset count'; end if;
 if has_function_privilege('anon','public.check_ai_rate_limit(text,integer,integer)','EXECUTE')
  or has_function_privilege('authenticated','public.check_ai_rate_limit(text,integer,integer)','EXECUTE') then raise exception 'FAIL public counter mutation'; end if;
end $$;
select 'PASS: allowed requests, rejected excess, window reset and server-only execution' as result;
rollback;
