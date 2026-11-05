import { afterEach, describe, expect, it, vi } from 'vitest';

import { customFetch } from '../../lib/retryFetch';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('HTTP retries', () => {
  it('does not replay a write after an ambiguous server failure', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response('', { status: 502 }));
    vi.stubGlobal('fetch', fetcher);
    expect(
      (await customFetch('https://example.org', { method: 'POST', body: '{}' }))
        .status,
    ).toBe(502);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not replay a write after a lost response', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('network lost'));
    vi.stubGlobal('fetch', fetcher);
    await expect(
      customFetch('https://example.org', { method: 'POST' }),
    ).rejects.toThrow('network lost');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('retries a temporary read failure', async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 502 }))
      .mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', fetcher);
    const result = customFetch('https://example.org');
    await vi.runAllTimersAsync();
    expect(await (await result).text()).toBe('ok');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('retries a 503 service unavailable on read', async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValue(new Response('recovered'));
    vi.stubGlobal('fetch', fetcher);
    const result = customFetch('https://example.org');
    await vi.runAllTimersAsync();
    expect(await (await result).text()).toBe('recovered');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('retries a 429 rate limit on read', async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', fetcher);
    const result = customFetch('https://example.org');
    await vi.runAllTimersAsync();
    expect(await (await result).text()).toBe('ok');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('does not retry cancellation', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    vi.stubGlobal('fetch', fetcher);
    await expect(customFetch('https://example.org')).rejects.toThrow(
      'cancelled',
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
