import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useBitcoinPrice hook', () => {
  it('fetches and returns BTC price', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ bpi: { USD: { rate_float: 12345.67 } } }),
    } as any);

    const { result } = renderHook(() => useBitcoinPrice());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.price).toBe(12345.67);
    expect(result.current.error).toBeNull();
  });
});
