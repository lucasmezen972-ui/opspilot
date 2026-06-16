import { useEffect, useState } from 'react';

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

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setOrganizations([]);
      setStatus('idle');
      return () => {
        alive = false;
      };
    }

    setStatus('loading');
    void supabase
      .rpc(PORTFOLIO_RPC)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setOrganizations([]);
          setStatus(error.code === '42501' ? 'forbidden' : 'unavailable');
          return;
        }
        setOrganizations(normalizeOrganizationPortfolio(data));
        setStatus('ready');
      })
      .catch(() => {
        if (!alive) return;
        setOrganizations([]);
        setStatus('error');
      });

    return () => {
      alive = false;
    };
  }, [enabled]);

  return { organizations, status };
}
