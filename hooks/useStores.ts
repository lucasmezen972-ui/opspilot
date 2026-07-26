import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { DEMO_ORG_ID } from '../lib/demoData';
import { supabase, type Store } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

const DEMO_STORES: Store[] = [
  {
    id: 'demo-store-001',
    organization_id: DEMO_ORG_ID,
    name: 'Magasin Centre-Ville',
    address: '12 rue du Commerce',
    city: 'Lyon',
    postal_code: '69002',
    country: 'FR',
    latitude: null,
    longitude: null,
    manager_id: null,
    settings: {},
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const fetchStores = useCallback(async () => {
    if (isLocalDemo) {
      setStores(DEMO_STORES);
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
      const { data, error: fetchErr } = await supabase
        .from('stores')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchErr) {
        setError(mapSupabaseError('Erreur récupération magasins', fetchErr));
        return;
      }

      setStores(data || []);
    } catch (err) {
      setError(mapSupabaseError('Erreur useStores', err));
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return { stores, loading, error, refetch: fetchStores };
}
