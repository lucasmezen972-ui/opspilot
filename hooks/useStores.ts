import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Store } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const fetchStores = useCallback(async () => {
    if (isLocalDemo) {
      setStores([]);
      setLoading(false);
      return;
    }
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        setError(mapSupabaseError('Erreur récupération magasins', error));
        return;
      }

      setStores(data || []);
    } catch (err) {
      setError(mapSupabaseError('Store fetch error', err));
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return { stores, loading, error, refetch: fetchStores };
}
