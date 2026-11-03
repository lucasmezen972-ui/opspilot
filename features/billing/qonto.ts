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
