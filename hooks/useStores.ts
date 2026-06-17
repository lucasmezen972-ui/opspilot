import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Store } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
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
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        mapSupabaseError('Erreur récupération magasins', error);
        return;
      }

      setStores(data || []);
    } catch (error) {
      mapSupabaseError('Erreur useStores', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return { stores, loading, refetch: fetchStores };
}
