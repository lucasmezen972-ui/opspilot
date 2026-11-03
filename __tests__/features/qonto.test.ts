import { describe, expect, it } from 'vitest';

import { isQontoPaymentUrl } from '../../features/billing/qonto';

describe('Qonto payment destinations', () => {
  it('accepts a genuine hosted payment URL', () => {
    expect(
      isQontoPaymentUrl('https://pay.qonto.com/invoice-123?resource_id=abc'),
    ).toBe(true);
  });
  it('rejects spoofed domains, credentials and non HTTPS links', () => {
    for (const url of [
      'https://pay.qonto.com.evil.test/a',
      'https://pay.qonto.com@evil.test/a',
      'https://user@pay.qonto.com/a',
      'http://pay.qonto.com/a',
      'ftp://pay.qonto.com/a',
      null,
    ]) {
      expect(isQontoPaymentUrl(url)).toBe(false);
    }
  });
});
