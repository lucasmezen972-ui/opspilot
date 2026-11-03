import { useEffect, useState, useCallback, useRef } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Subscription } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useSubscription() {
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;
  const owner = `${profile?.id ?? ''}:${profile?.organization_id ?? ''}:${isLocalDemo}`;
  const activeOwner = useRef(owner);
  activeOwner.current = owner;
  const sequence = useRef(0);
  const [state, setState] = useState<{
    owner: string;
    subscription: Subscription | null;
    loading: boolean;
    error: string | null;
  }>({ owner, subscription: null, loading: true, error: null });

  const fetchSubscription = useCallback(async () => {
    if (activeOwner.current !== owner) return;
    const run = ++sequence.current;
    if (isLocalDemo) {
      setState({
        owner,
        loading: false,
        error: null,
        subscription: {
          id: 'demo-sub',
          organization_id: profile?.organization_id ?? '',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          plan: 'trial',
          status: 'trialing',
          trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
          current_period_end: null,
        },
      });
      return;
    }
    if (!profile?.organization_id) {
      setState({ owner, subscription: null, loading: false, error: null });
      return;
    }

    try {
      setState((previous) => ({
        owner,
        subscription: previous.owner === owner ? previous.subscription : null,
        loading: true,
        error: null,
      }));
      const { data, error: fetchErr } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (run === sequence.current)
        setState({ owner, subscription: data, loading: false, error: null });
    } catch (err) {
      if (run === sequence.current)
        setState((previous) => ({
          ...previous,
          loading: false,
          error: mapSupabaseError('Abonnement indisponible', err),
        }));
    }
  }, [profile?.organization_id, isLocalDemo, owner]);

  useEffect(() => {
    fetchSubscription();
    return () => {
      sequence.current++;
    };
  }, [fetchSubscription]);

  const subscription = state.owner === owner ? state.subscription : null;
  const trialDaysLeft = (() => {
    if (!subscription?.trial_ends_at) return null;
    const diff = new Date(subscription.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  })();

  return {
    subscription,
    loading: state.owner !== owner || state.loading,
    error: state.owner === owner ? state.error : null,
    trialDaysLeft,
    refetch: fetchSubscription,
  };
}
