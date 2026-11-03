import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export interface BillingRequest {
  id: string;
  organization_id: string;
  plan: string;
  status: 'requested' | 'awaiting_payment' | 'paid' | 'canceled';
  payment_url: string | null;
  qonto_reference: string | null;
  payment_provider?: 'qonto' | 'mollie';
  mollie_payment_id?: string | null;
  amount_cents?: number | null;
  paid_until?: string | null;
}

export function useQontoBilling() {
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;
  const owner = `${profile?.id ?? ''}:${profile?.organization_id ?? ''}:${isLocalDemo}`;
  const activeOwner = useRef(owner);
  activeOwner.current = owner;
  const sequence = useRef(0);
  const [state, setState] = useState<{
    owner: string;
    requests: BillingRequest[];
    loading: boolean;
    error: string | null;
  }>({ owner, requests: [], loading: true, error: null });
  const refetch = useCallback(async () => {
    if (activeOwner.current !== owner) return;
    const run = ++sequence.current;
    if (isLocalDemo || !profile?.organization_id) {
      setState({ owner, requests: [], loading: false, error: null });
      return;
    }
    setState((previous) => ({
      owner,
      requests: previous.owner === owner ? previous.requests : [],
      loading: true,
      error: null,
    }));
    try {
      const { data, error } = await supabase
        .from('billing_requests')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      if (run === sequence.current)
        setState({ owner, requests: data ?? [], loading: false, error: null });
    } catch (issue) {
      if (run === sequence.current)
        setState((previous) => ({
          ...previous,
          loading: false,
          error:
            'Les demandes de facture ne peuvent pas être actualisées. Réessayez pour vérifier leur état.',
        }));
      throw issue;
    }
  }, [isLocalDemo, profile?.organization_id, owner]);
  useEffect(() => {
    refetch().catch(() => {}); // The error is exposed to the screen, not hidden as an empty list.
    return () => {
      sequence.current++;
    };
  }, [refetch]);
  const requestInvoice = async (plan: string): Promise<BillingRequest> => {
    if (isLocalDemo) throw new Error('Facturation indisponible en démo');
    const { data, error } = await supabase.rpc('request_qonto_billing', {
      p_plan: plan,
    });
    if (activeOwner.current !== owner)
      throw new Error(
        'Le compte a changé pendant la demande. Consultez la facturation du compte concerné pour vérifier son enregistrement.',
      );
    if (error !== null || !data)
      throw new Error('La demande de facture n’a pas pu être enregistrée.');
    // The write is confirmed. A failed read must not turn it into a failed request.
    setState((previous) =>
      previous.owner === owner
        ? {
            ...previous,
            requests: [
              data,
              ...previous.requests.filter((request) => request.id !== data.id),
            ],
          }
        : previous,
    );
    await refetch().catch(() => {});
    return data as BillingRequest;
  };
  return {
    requests: state.owner === owner ? state.requests : [],
    loading: state.owner !== owner || state.loading,
    error: state.owner === owner ? state.error : null,
    requestInvoice,
    refetch,
  };
}
