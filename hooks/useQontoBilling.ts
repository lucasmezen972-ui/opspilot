import { useCallback, useEffect, useState } from 'react';

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
  const [requests, setRequests] = useState<BillingRequest[]>([]);
  const isLocalDemo = isDemoMode && !session;
  const refetch = useCallback(async () => {
    if (isLocalDemo || !profile?.organization_id) return;
    const { data, error } = await supabase
      .from('billing_requests')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    setRequests(data ?? []);
  }, [isLocalDemo, profile?.organization_id]);
  useEffect(() => {
    refetch().catch(() => setRequests([]));
  }, [refetch]);
  const requestInvoice = async (plan: string): Promise<BillingRequest> => {
    if (isLocalDemo) throw new Error('Facturation indisponible en démo');
    const { data, error } = await supabase.rpc('request_qonto_billing', {
      p_plan: plan,
    });
    if (error !== null || !data)
      throw new Error('La demande de facture n’a pas pu être enregistrée.');
    await refetch();
    return data as BillingRequest;
  };
  return { requests, requestInvoice, refetch };
}
