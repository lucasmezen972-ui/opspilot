/*
  Assistant IA OpsPilot

  Rate limit distribué pour la fonction Edge ai-assistant.
  La table n'est jamais accessible depuis le client : seule la fonction
  SECURITY DEFINER, elle-même réservée au service_role, peut la modifier.
*/

CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  rate_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ai_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  rate_key text,
  max_requests integer,
  window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_window timestamptz;
  current_count integer;
  current_time timestamptz := clock_timestamp();
BEGIN
  IF rate_key IS NULL
    OR length(rate_key) = 0
    OR max_requests <= 0
    OR window_seconds <= 0
  THEN
    RETURN false;
  END IF;

  INSERT INTO public.ai_rate_limits (
    rate_key,
    window_started_at,
    request_count,
    updated_at
  )
  VALUES (rate_key, current_time, 0, current_time)
  ON CONFLICT (rate_key) DO NOTHING;

  SELECT window_started_at, request_count
    INTO current_window, current_count
  FROM public.ai_rate_limits
  WHERE ai_rate_limits.rate_key = check_ai_rate_limit.rate_key
  FOR UPDATE;

  IF current_time >= current_window + make_interval(secs => window_seconds) THEN
    UPDATE public.ai_rate_limits
    SET window_started_at = current_time,
        request_count = 1,
        updated_at = current_time
    WHERE ai_rate_limits.rate_key = check_ai_rate_limit.rate_key;
    RETURN true;
  END IF;

  IF current_count >= max_requests THEN
    RETURN false;
  END IF;

  UPDATE public.ai_rate_limits
  SET request_count = request_count + 1,
      updated_at = current_time
  WHERE ai_rate_limits.rate_key = check_ai_rate_limit.rate_key;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_ai_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(text, integer, integer)
  TO service_role;
