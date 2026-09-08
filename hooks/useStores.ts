import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { demoId } from '../lib/demoData';
import { updateDemoCollection, useDemoCollection } from '../lib/demoStore';
import { supabase, type Store } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useStores() {
  const [remoteStores, setRemoteStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const demoStores = useDemoCollection('stores');
  const stores = isLocalDemo ? demoStores : remoteStores;
  const setStores = isLocalDemo
    ? (updater: (prev: Store[]) => Store[]) =>
        updateDemoCollection('stores', updater)
    : setRemoteStores;

  const fetchStores = useCallback(async () => {
    if (isLocalDemo) {
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

      setRemoteStores(data || []);
    } catch (err) {
      setError(mapSupabaseError('Erreur useStores', err));
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const createStore = async (storeData: Partial<Store>) => {
    if (!profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    if (isLocalDemo) {
      const now = new Date().toISOString();
      const data: Store = {
        id: demoId('demo-store'),
        organization_id: profile.organization_id,
        name: storeData.name ?? '',
        address: storeData.address ?? null,
        city: storeData.city ?? null,
        postal_code: storeData.postal_code ?? null,
        country: storeData.country ?? 'FR',
        latitude: storeData.latitude ?? null,
        longitude: storeData.longitude ?? null,
        manager_id: storeData.manager_id ?? null,
        settings: storeData.settings ?? {},
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      setStores((prev) => [data, ...prev]);
      return { data, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          organization_id: profile.organization_id,
          name: storeData.name ?? '',
          address: storeData.address ?? null,
          city: storeData.city ?? null,
          postal_code: storeData.postal_code ?? null,
          country: storeData.country ?? 'FR',
          latitude: storeData.latitude ?? null,
          longitude: storeData.longitude ?? null,
          manager_id: storeData.manager_id ?? null,
          settings: storeData.settings ?? {},
        })
        .select()
        .single();
      if (error) {
        return {
          data: null,
          error: mapSupabaseError('Erreur création magasin', error),
        };
      }
      setRemoteStores((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur createStore', error),
      };
    }
  };

  const updateStore = async (id: string, updates: Partial<Store>) => {
    const payload = { ...updates, updated_at: new Date().toISOString() };

    if (isLocalDemo) {
      const existing = stores.find((s) => s.id === id);
      if (!existing) return { data: null, error: 'Magasin introuvable' };
      const updated = { ...existing, ...payload } as Store;
      setStores((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return { data: updated, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('stores')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        return {
          data: null,
          error: mapSupabaseError('Erreur mise à jour magasin', error),
        };
      }
      setRemoteStores((prev) => prev.map((s) => (s.id === id ? data : s)));
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur updateStore', error),
      };
    }
  };

  return {
    stores,
    loading,
    error,
    refetch: fetchStores,
    createStore,
    updateStore,
  };
}
