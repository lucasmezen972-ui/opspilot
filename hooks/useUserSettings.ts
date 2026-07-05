import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './useAuth';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../features/settings/preferences';
import { updateDemoCollection, useDemoCollection } from '../lib/demoStore';
import { supabase, type NotificationPreferences } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

type SaveResult = { error: string | null };

export function useUserSettings() {
  const { profile, session, isDemoMode, updateProfile } = useAuth();
  const demoSettings = useDemoCollection('settings');
  const isLocalDemo = isDemoMode && !session;
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [organizationName, setOrganizationName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (isLocalDemo) {
      setLoading(false);
      return;
    }
    if (!profile?.id || !profile.organization_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const preferencesQuery = supabase
        .from('user_preferences')
        .select(
          'audit_notifications, action_notifications, training_notifications, weekly_summary',
        )
        .eq('user_id', profile.id)
        .maybeSingle();
      const organizationQuery = supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single();
      const storeQuery = profile.store_id
        ? supabase
            .from('stores')
            .select('name')
            .eq('id', profile.store_id)
            .single()
        : Promise.resolve({ data: null, error: null });

      const [preferencesResult, organizationResult, storeResult] =
        await Promise.all([preferencesQuery, organizationQuery, storeQuery]);

      if (preferencesResult.error) {
        mapSupabaseError(
          'Erreur récupération préférences',
          preferencesResult.error,
        );
      } else if (preferencesResult.data) {
        setPreferences({
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...preferencesResult.data,
        });
      }

      if (organizationResult.error) {
        mapSupabaseError(
          'Erreur récupération organisation',
          organizationResult.error,
        );
      } else {
        setOrganizationName(organizationResult.data?.name || '');
      }

      if (storeResult.error) {
        mapSupabaseError('Erreur récupération magasin', storeResult.error);
      } else {
        setStoreName(storeResult.data?.name || '');
      }
    } catch (err) {
      setError(mapSupabaseError('Erreur chargement réglages', err));
    } finally {
      setLoading(false);
    }
  }, [isLocalDemo, profile?.id, profile?.organization_id, profile?.store_id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveProfile = async (
    fullName: string,
    phone: string | null,
  ): Promise<SaveResult> => {
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone,
    });
    return {
      error: error
        ? mapSupabaseError('Erreur mise à jour profil', error)
        : null,
    };
  };

  const savePreferences = async (
    next: NotificationPreferences,
  ): Promise<SaveResult> => {
    if (isLocalDemo) {
      updateDemoCollection('settings', (current) => ({
        ...current,
        preferences: next,
      }));
      return { error: null };
    }
    if (!profile?.id || !profile.organization_id) {
      return { error: 'Profil incomplet.' };
    }

    const { error } = await supabase.from('user_preferences').upsert(
      {
        user_id: profile.id,
        organization_id: profile.organization_id,
        ...next,
      },
      { onConflict: 'user_id' },
    );
    if (error) {
      return {
        error: mapSupabaseError('Erreur mise à jour préférences', error),
      };
    }
    setPreferences(next);
    return { error: null };
  };

  const changePassword = async (password: string): Promise<SaveResult> => {
    if (isLocalDemo) return { error: null };
    const { error } = await supabase.auth.updateUser({ password });
    return {
      error: error
        ? mapSupabaseError('Erreur changement mot de passe', error)
        : null,
    };
  };

  const saveOrganization = async (
    nextOrganizationName: string,
    nextStoreName: string,
  ): Promise<SaveResult> => {
    if (profile?.role !== 'admin') {
      return { error: 'Action réservée aux administrateurs.' };
    }
    if (isLocalDemo) {
      updateDemoCollection('settings', (current) => ({
        ...current,
        organizationName: nextOrganizationName.trim(),
        storeName: nextStoreName.trim(),
      }));
      return { error: null };
    }
    if (!profile.organization_id) return { error: 'Organisation absente.' };

    const { error: organizationError } = await supabase
      .from('organizations')
      .update({ name: nextOrganizationName.trim() })
      .eq('id', profile.organization_id);
    if (organizationError) {
      return {
        error: mapSupabaseError(
          'Erreur mise à jour organisation',
          organizationError,
        ),
      };
    }

    if (profile.store_id && nextStoreName.trim()) {
      const { error: storeError } = await supabase
        .from('stores')
        .update({ name: nextStoreName.trim() })
        .eq('id', profile.store_id);
      if (storeError) {
        return {
          error: mapSupabaseError('Erreur mise à jour magasin', storeError),
        };
      }
    }

    setOrganizationName(nextOrganizationName.trim());
    setStoreName(nextStoreName.trim());
    return { error: null };
  };

  return {
    loading,
    error,
    isLocalDemo,
    preferences: isLocalDemo ? demoSettings.preferences : preferences,
    organizationName: isLocalDemo
      ? demoSettings.organizationName
      : organizationName,
    storeName: isLocalDemo ? demoSettings.storeName : storeName,
    saveProfile,
    savePreferences,
    changePassword,
    saveOrganization,
    refetch: fetchSettings,
  };
}
