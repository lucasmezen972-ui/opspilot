import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQontoBilling } from '../../hooks/useQontoBilling';
import { useSubscription } from '../../hooks/useSubscription';

const mocks = vi.hoisted(() => ({
  auth: {
    profile: { id: 'user-a', organization_id: 'org-a' },
    isDemoMode: false,
    session: {},
  },
  read: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: (_column: string, org: string) => ({
          order: () => ({ limit: () => mocks.read(table, org) }),
          maybeSingle: () => mocks.read(table, org),
        }),
      }),
    }),
    rpc: mocks.rpc,
  },
}));
const invoice = {
  id: 'invoice-a',
  organization_id: 'org-a',
  status: 'requested',
  plan: 'essential',
  payment_url: null,
  qonto_reference: null,
};
const deferred = () => {
  let resolve!: (value: { data: unknown; error: null }) => void;
  const promise = new Promise<{ data: unknown; error: null }>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('billing reads and confirmed writes', () => {
  beforeEach(() => {
    mocks.auth.profile = { id: 'user-a', organization_id: 'org-a' };
    mocks.read.mockReset().mockResolvedValue({ data: [], error: null });
    mocks.rpc.mockReset();
  });

  it('exposes an initial invoice read failure and recovers on retry', async () => {
    mocks.read.mockResolvedValueOnce({
      data: null,
      error: { message: 'unavailable' },
    });
    const { result } = renderHook(() => useQontoBilling());
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.loading).toBe(false);
    mocks.read.mockResolvedValueOnce({ data: [invoice], error: null });
    await act(() => result.current.refetch());
    expect(result.current.requests).toEqual([invoice]);
    expect(result.current.error).toBeNull();
  });

  it('keeps the confirmed invoice when the following read fails', async () => {
    const { result } = renderHook(() => useQontoBilling());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mocks.rpc.mockResolvedValue({ data: invoice, error: null });
    mocks.read.mockRejectedValueOnce(new Error('read offline after write'));
    let saved: unknown;
    await act(async () => {
      saved = await result.current.requestInvoice('essential');
    });
    expect(saved).toEqual(invoice);
    expect(result.current.requests).toEqual([invoice]);
    expect(result.current.error).toBeTruthy();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it('hides cached invoices immediately when the account changes', async () => {
    mocks.read.mockResolvedValueOnce({ data: [invoice], error: null });
    const { result, rerender } = renderHook(() => useQontoBilling());
    await waitFor(() => expect(result.current.requests).toEqual([invoice]));
    const next = deferred();
    mocks.read.mockReturnValueOnce(next.promise);
    mocks.auth.profile = { id: 'user-b', organization_id: 'org-b' };
    rerender();
    expect(result.current.requests).toEqual([]);
    expect(result.current.loading).toBe(true);
    await act(async () => next.resolve({ data: [], error: null }));
  });

  it('ignores an older invoice response after an account switch', async () => {
    const old = deferred();
    mocks.read.mockReturnValueOnce(old.promise);
    const { result, rerender } = renderHook(() => useQontoBilling());
    mocks.auth.profile = { id: 'user-b', organization_id: 'org-b' };
    rerender();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => old.resolve({ data: [invoice], error: null }));
    expect(result.current.requests).toEqual([]);
  });

  it('never returns a late invoice or its payment link to another account', async () => {
    const write = deferred();
    const { result, rerender } = renderHook(() => useQontoBilling());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mocks.rpc.mockReturnValueOnce(write.promise);
    let pending!: Promise<unknown>;
    act(() => {
      pending = result.current
        .requestInvoice('essential')
        .catch((issue: Error) => issue);
    });
    mocks.auth.profile = { id: 'user-b', organization_id: 'org-b' };
    rerender();
    await act(async () =>
      write.resolve({
        data: { ...invoice, payment_url: 'https://pay.qonto.com/fictitious' },
        error: null,
      }),
    );
    const outcome = await pending;
    expect(outcome).toBeInstanceOf(Error);
    expect((outcome as Error).message).toContain('Le compte a changé');
    expect(result.current.requests).toEqual([]);
  });

  it('exposes a failed subscription read without inventing a trial', async () => {
    mocks.read.mockResolvedValueOnce({
      data: null,
      error: { message: 'offline' },
    });
    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.subscription).toBeNull();
    expect(result.current.trialDaysLeft).toBeNull();
  });

  it('ignores a subscription response belonging to the previous account', async () => {
    const old = deferred();
    mocks.read
      .mockReturnValueOnce(old.promise)
      .mockResolvedValue({ data: null, error: null });
    const { result, rerender } = renderHook(() => useSubscription());
    mocks.auth.profile = { id: 'user-b', organization_id: 'org-b' };
    rerender();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () =>
      old.resolve({
        data: { id: 'old-subscription', plan: 'essential' },
        error: null,
      }),
    );
    expect(result.current.subscription).toBeNull();
  });
});
