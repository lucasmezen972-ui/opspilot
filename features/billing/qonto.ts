/** Payment destinations are returned by the server, never by a browser query. */
export function isQontoPaymentUrl(
  value: string | null | undefined,
): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.origin === 'https://pay.qonto.com' &&
      !url.username &&
      !url.password &&
      url.pathname !== '/'
    );
  } catch {
    return false;
  }
}

export function isBillingPaymentUrl(request: {
  payment_url: string | null;
  payment_provider?: string;
  mollie_payment_id?: string | null;
}): boolean {
  if (request.payment_provider !== 'mollie')
    return isQontoPaymentUrl(request.payment_url);
  if (
    !request.payment_url ||
    !/^tr_[A-Za-z0-9]{5,100}$/.test(request.mollie_payment_id ?? '')
  )
    return false;
  try {
    const url = new URL(request.payment_url);
    return (
      !url.username &&
      !url.password &&
      ((url.origin === 'https://www.mollie.com' &&
        url.pathname.startsWith('/checkout/')) ||
        (url.origin === 'https://checkout.mollie.com' && url.pathname !== '/'))
    );
  } catch {
    return false;
  }
}
