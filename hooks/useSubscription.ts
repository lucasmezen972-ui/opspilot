import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Subscription } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const fetchSubscription = useCallback(async () => {
    if (isLocalDemo) {
      setSubscription({
        id: 'demo-sub',
        organization_id: profile?.organization_id ?? '',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        plan: 'trial',
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        current_period_end: null,
      });
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
        .from('subscriptions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (error) {
        setError(mapSupabaseError('Erreur récupération abonnement', error));
        return;
      }

      setSubscription(data);
    } catch (err) {
      setError(mapSupabaseError('Subscription fetch error', err));
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const trialDaysLeft = (() => {
    if (!subscription?.trial_ends_at) return null;
    const diff = new Date(subscription.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  })();

  return {
    subscription,
    loading,
    error,
    trialDaysLeft,
    refetch: fetchSubscription,
  };
}
