export interface MollieConfig {
  api_key: string;
  status_api_key?: string;
  profile_id: string;
  app_url: string;
  mode: 'live' | 'test';
  enabled: boolean;
}

export interface PaymentAttempt {
  id: string;
  request_id: string;
  organization_id: string;
  plan: string;
  profile_id: string;
  mode: 'live' | 'test';
  amount_cents: number;
  invoice_reference: string;
  paid_until: string;
  payment_id?: string | null;
  checkout_url?: string | null;
}

export interface MolliePayment {
  id: string;
  profileId: string;
  mode: string;
  status: string;
  amount: { currency: string; value: string };
  paidAt?: string;
  metadata?: Record<string, unknown>;
  amountRefunded?: { value: string };
  amountChargedBack?: { value: string };
  _links?: { checkout?: { href: string } };
}

export async function readSmallBody(
  request: Request,
  maximum = 4096,
): Promise<string> {
  if (Number(request.headers.get('content-length')) > maximum)
    throw new Error('body_too_large');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximum) {
      await reader.cancel();
      throw new Error('body_too_large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export function euroCents(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{1,7}\.\d{2}$/.test(value)) return null;
  const [whole, fraction] = value.split('.');
  return Number(whole) * 100 + Number(fraction);
}

export function isMollieCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const u = new URL(value);
    return (
      !u.username &&
      !u.password &&
      ((u.origin === 'https://www.mollie.com' &&
        u.pathname.startsWith('/checkout/')) ||
        (u.origin === 'https://checkout.mollie.com' && u.pathname !== '/'))
    );
  } catch {
    return false;
  }
}

export function paymentMetadata(attempt: PaymentAttempt) {
  return {
    purpose: 'opspilot_billing_v1',
    attempt_id: attempt.id,
    request_id: attempt.request_id,
    organization_id: attempt.organization_id,
    plan: attempt.plan,
    invoice_reference: attempt.invoice_reference,
  };
}

export function matchesPayment(
  payment: MolliePayment,
  attempt: PaymentAttempt,
): boolean {
  const expected = paymentMetadata(attempt);
  return (
    payment?.id === attempt.payment_id &&
    payment.profileId === attempt.profile_id &&
    payment.mode === attempt.mode &&
    payment.amount?.currency === 'EUR' &&
    euroCents(payment.amount?.value) === attempt.amount_cents &&
    Object.entries(expected).every(
      ([key, value]) => payment.metadata?.[key] === value,
    )
  );
}

export function buildPayment(
  attempt: PaymentAttempt,
  appUrl: string,
  supabaseUrl: string,
) {
  const destination = new URL(appUrl);
  if (destination.origin !== 'https://opspilot-mu-six.vercel.app')
    throw new Error('Invalid app origin');
  return {
    amount: { currency: 'EUR', value: (attempt.amount_cents / 100).toFixed(2) },
    description:
      `OpsPilot ${attempt.plan} — facture ${attempt.invoice_reference}`.slice(
        0,
        255,
      ),
    // Payment credentials are restricted to this single profile in Mollie.
    // Mollie selects the profile from the credential, not a browser input.
    redirectUrl: new URL('/billing?payment_return=1', destination.origin).href,
    cancelUrl: new URL('/billing?payment_return=1', destination.origin).href,
    webhookUrl: `${supabaseUrl}/functions/v1/mollie-webhook`,
    sequenceType: 'oneoff',
    locale: 'fr_FR',
    metadata: paymentMetadata(attempt),
  };
}

/** Fixed API origin; no secrets in errors or logs and no redirect forwarding. */
export async function mollieRequest<T>(
  config: MollieConfig,
  path: string,
  body?: unknown,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.api_key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const result = await fetch(`https://api.mollie.com/v2/${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(7000),
    redirect: 'error',
  });
  if (!result.ok) throw new Error(`provider_http_${result.status}`);
  return (await result.json()) as T;
}
