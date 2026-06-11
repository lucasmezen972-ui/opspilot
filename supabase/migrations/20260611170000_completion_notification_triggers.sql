/*
  Notifications de clôture d'audit / fin de formation (appliqué sur V2,
  idempotent). Destinataires configurés par organisation dans le back-office
  (app_settings : notify.audit_completed / notify.training_completed,
  { enabled, recipients: [...] }). Désactivé par défaut.
  Déclenché en base → send-transactional via pg_net (notify_transactional).
*/

CREATE OR REPLACE FUNCTION public.tg_audit_completed_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_setting jsonb;
  v_rec text;
  v_org text;
  v_auditor text;
begin
  if NEW.status = 'completed'
     and (TG_OP = 'INSERT' or OLD.status is distinct from 'completed') then
    select value into v_setting from public.app_settings
      where organization_id = NEW.organization_id and key = 'notify.audit_completed';
    if v_setting is null or coalesce((v_setting->>'enabled')::boolean, false) = false then
      return NEW;
    end if;
    select name into v_org from public.organizations where id = NEW.organization_id;
    select full_name into v_auditor from public.profiles where id = NEW.auditor_id;
    for v_rec in
      select jsonb_array_elements_text(coalesce(v_setting->'recipients', '[]'::jsonb))
    loop
      perform public.notify_transactional(
        'audit_completed', v_rec, NEW.organization_id,
        jsonb_build_object('audit', NEW.title, 'score', NEW.score,
                           'location', NEW.location, 'org', v_org,
                           'auditor', v_auditor)
      );
    end loop;
  end if;
  return NEW;
end;
$$;
DROP TRIGGER IF EXISTS trg_audit_completed_email ON public.audits;
CREATE TRIGGER trg_audit_completed_email
  AFTER INSERT OR UPDATE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_completed_email();

CREATE OR REPLACE FUNCTION public.tg_training_completed_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
declare
  v_org_id uuid;
  v_title text;
  v_setting jsonb;
  v_rec text;
  v_org text;
  v_person text;
begin
  if NEW.status = 'completed'
     and (TG_OP = 'INSERT' or OLD.status is distinct from 'completed') then
    select organization_id, title into v_org_id, v_title
      from public.trainings where id = NEW.training_id;
    if v_org_id is null then return NEW; end if;
    select value into v_setting from public.app_settings
      where organization_id = v_org_id and key = 'notify.training_completed';
    if v_setting is null or coalesce((v_setting->>'enabled')::boolean, false) = false then
      return NEW;
    end if;
    select name into v_org from public.organizations where id = v_org_id;
    select full_name into v_person from public.profiles where id = NEW.user_id;
    for v_rec in
      select jsonb_array_elements_text(coalesce(v_setting->'recipients', '[]'::jsonb))
    loop
      perform public.notify_transactional(
        'training_completed', v_rec, v_org_id,
        jsonb_build_object('training', v_title, 'person', v_person,
                           'score', NEW.score, 'org', v_org)
      );
    end loop;
  end if;
  return NEW;
end;
$$;
DROP TRIGGER IF EXISTS trg_training_completed_email ON public.user_training_progress;
CREATE TRIGGER trg_training_completed_email
  AFTER INSERT OR UPDATE ON public.user_training_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_training_completed_email();
