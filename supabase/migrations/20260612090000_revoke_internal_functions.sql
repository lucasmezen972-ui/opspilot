/*
  Debug sécurité (appliqué sur V2, idempotent) : les fonctions internes
  (triggers email, copie de contenus par défaut) étaient exposées en RPC
  à anon/authenticated (EXECUTE par défaut de Postgres). En particulier,
  copy_default_audit_templates(uuid) / copy_default_trainings(uuid)
  permettaient à un appelant anonyme de déclencher des écritures dans
  n'importe quelle organisation. Aucune de ces fonctions ne doit être
  appelable via l'API : elles ne servent qu'aux triggers (exécutés en
  tant que propriétaire) et au service_role.
*/

REVOKE EXECUTE ON FUNCTION public.tg_welcome_email() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_invitation_email() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_subscription_active_email() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_audit_completed_email() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_training_completed_email() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.copy_default_audit_templates(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.copy_default_audit_templates_on_organization() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.copy_default_trainings(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.copy_default_trainings_on_organization() FROM public, anon, authenticated;
