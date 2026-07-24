import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export type SettingsMap = Record<string, Record<string, unknown>>;

/**
 * Un module est activé par défaut : seul un { enabled: false } explicite
 * (posé depuis le back-office superadmin) le désactive.
 */
export function isFeatureEnabled(settings: SettingsMap, key: string): boolean {
  return settings[key]?.enabled !== false;
}

/**
 * Réglages d'application de l'organisation (table app_settings), pilotés
 * depuis le back-office superadmin. En démo locale : tout est activé.
 */
export function useAppSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const fetchSettings = useCallback(async () => {
    if (isLocalDemo || !profile?.organization_id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('organization_id', profile.organization_id);
      if (!error && data) {
        setSettings(
          Object.fromEntries(data.map((r) => [r.key, r.value ?? {}])),
        );
      }
    } catch (err) {
      setError(mapSupabaseError('Erreur fetchAppSettings', err));
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isEnabled = useCallback(
    (key: string) => isFeatureEnabled(settings, key),
    [settings],
  );

  return { settings, loading, error, isEnabled, refetch: fetchSettings };
}
