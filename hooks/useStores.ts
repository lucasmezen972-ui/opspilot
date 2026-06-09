import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Store } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchStores = useCallback(async () => {
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
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return { stores, loading, refetch: fetchStores };
}
