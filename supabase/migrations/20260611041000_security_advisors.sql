/*
  Advisors sécurité Supabase (appliqué sur V2 hpqfmuzkkxrqoqoabjmb) :
  - search_path immuable sur les fonctions du schéma stripe ;
  - extension pg_net réinstallée hors de public (schéma extensions).

  Idempotent : rejouable sans effet de bord. Le drop/create de pg_net se fait
  dans la même transaction ; ses fonctions restent dans le schéma net
  (net.http_post), le cron stripe-sync-worker n'est pas impacté.
*/

ALTER FUNCTION stripe.set_updated_at() SET search_path = '';
ALTER FUNCTION stripe.set_updated_at_metadata() SET search_path = '';
ALTER FUNCTION stripe.check_rate_limit(rate_key text, max_requests integer, window_seconds integer)
  SET search_path = '';

CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;
