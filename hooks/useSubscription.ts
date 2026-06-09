import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Subscription } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchSubscription = useCallback(async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (error) {
        mapSupabaseError('Erreur récupération abonnement', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      mapSupabaseError('Erreur useSubscription', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const trialDaysLeft = (() => {
    if (!subscription?.trial_ends_at) return null;
    const diff = new Date(subscription.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  })();

  return { subscription, loading, trialDaysLeft, refetch: fetchSubscription };
}
