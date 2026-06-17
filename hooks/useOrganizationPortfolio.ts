import { useCallback, useEffect, useState } from 'react';

import type { ClientOrganization } from '../features/backoffice/backofficeModel';
import { normalizeOrganizationPortfolio } from '../features/backoffice/organizationPortfolio';
import { supabase } from '../lib/supabase';

export type OrganizationPortfolioStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'unavailable'
  | 'forbidden'
  | 'error';

const PORTFOLIO_RPC = ['superadmin', 'organizations'].join('_');

export function useOrganizationPortfolio(enabled: boolean) {
  const [organizations, setOrganizations] = useState<ClientOrganization[]>([]);
  const [status, setStatus] = useState<OrganizationPortfolioStatus>('idle');
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setOrganizations([]);
      setStatus('idle');
      return () => {
        alive = false;
      };
    }

    async function loadPortfolio() {
      setStatus('loading');
      try {
        const { data, error } = await supabase.rpc(PORTFOLIO_RPC);
        if (!alive) return;
        if (error) {
          setOrganizations([]);
          setStatus(error.code === '42501' ? 'forbidden' : 'unavailable');
          return;
        }
        setOrganizations(normalizeOrganizationPortfolio(data));
        setStatus('ready');
      } catch {
        if (!alive) return;
        setOrganizations([]);
        setStatus('error');
      }
    }

    loadPortfolio().catch(() => {
      if (!alive) return;
      setOrganizations([]);
      setStatus('error');
    });

    return () => {
      alive = false;
    };
  }, [enabled, reloadKey]);

  return { organizations, status, refetch };
}
