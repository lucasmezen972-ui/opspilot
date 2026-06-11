/*
  Emails transactionnels (appliqué sur V2, idempotent) : triggers qui
  appellent l'Edge Function send-transactional via pg_net.
  - bienvenue : profil admin créé (= nouvelle organisation) ;
  - invitation : invitation créée ;
  - confirmation : abonnement passé à « active ».
  Le jeton d'appel est lu en base (platform_settings), jamais exposé.
  La déduplication (envoi unique) est gérée côté fonction via email_log.
*/

CREATE OR REPLACE FUNCTION public.notify_transactional(
  p_type text,
  p_to text,
  p_org uuid,
  p_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
declare
  v_token text;
begin
  select value->>'token' into v_token
    from public.platform_settings where key = 'email_worker_token';
  if v_token is null then return; end if;

  perform net.http_post(
    url := 'https://hpqfmuzkkxrqoqoabjmb.supabase.co/functions/v1/send-transactional',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-worker-token', v_token
    ),
    body := jsonb_build_object(
      'type', p_type,
      'to', p_to,
      'organization_id', p_org,
      'data', p_data
    )
  );
end;
$$;

CREATE OR REPLACE FUNCTION public.tg_welcome_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_org text;
begin
  if NEW.role = 'admin' and NEW.email is not null
     and NEW.email not like '%@opspilot.com' then
    select name into v_org from public.organizations where id = NEW.organization_id;
    perform public.notify_transactional(
      'welcome', NEW.email, NEW.organization_id,
      jsonb_build_object('name', NEW.full_name, 'org', v_org)
    );
  end if;
  return NEW;
end;
$$;
DROP TRIGGER IF EXISTS trg_welcome_email ON public.profiles;
CREATE TRIGGER trg_welcome_email AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_welcome_email();

CREATE OR REPLACE FUNCTION public.tg_invitation_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_org text;
begin
  select name into v_org from public.organizations where id = NEW.organization_id;
  perform public.notify_transactional(
    'invitation', NEW.email, NEW.organization_id,
    jsonb_build_object('token', NEW.token::text, 'role', NEW.role, 'org', v_org)
  );
  return NEW;
end;
$$;
DROP TRIGGER IF EXISTS trg_invitation_email ON public.invitations;
CREATE TRIGGER trg_invitation_email AFTER INSERT ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.tg_invitation_email();

CREATE OR REPLACE FUNCTION public.tg_subscription_active_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_org text;
begin
  if NEW.status = 'active' and OLD.status is distinct from 'active' then
    select name into v_org from public.organizations where id = NEW.organization_id;
    perform public.notify_transactional(
      'subscription_active', null, NEW.organization_id,
      jsonb_build_object('plan', NEW.plan, 'org', v_org)
    );
  end if;
  return NEW;
end;
$$;
DROP TRIGGER IF EXISTS trg_subscription_active_email ON public.subscriptions;
CREATE TRIGGER trg_subscription_active_email AFTER UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_subscription_active_email();

REVOKE EXECUTE ON FUNCTION public.notify_transactional(text, text, uuid, jsonb)
  FROM public, anon, authenticated;
