-- Accept the existing scalar worker token without rotating it or changing other workers.
create or replace function public.dispatch_customer_portal_sync() returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare worker_token text;
begin
  if not exists(select 1 from public.platform_settings where key='customer_portal_sync' and value->>'enabled'='true') then return; end if;
  if not exists(select 1 from public.customer_portal_outbox where status='pending' and next_attempt_at<=now() and (lease_until is null or lease_until<=now())) then return; end if;
  select case jsonb_typeof(value) when 'string' then value#>>'{}' else value->>'token' end
    into worker_token from public.platform_settings where key='email_worker_token';
  if coalesce(length(worker_token),0) not between 32 and 256 then return; end if;
  perform net.http_post(url:='https://hpqfmuzkkxrqoqoabjmb.supabase.co/functions/v1/customer-portal-sync',headers:=jsonb_build_object('Content-Type','application/json','x-worker-token',worker_token),body:='{}'::jsonb,timeout_milliseconds:=15000);
end $$;
revoke all on function public.dispatch_customer_portal_sync() from public,anon,authenticated;
grant execute on function public.dispatch_customer_portal_sync() to service_role;
