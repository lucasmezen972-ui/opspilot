export function readCustomerPortalWorkerToken(value: unknown): string {
  const token =
    typeof value === 'string'
      ? value
      : value && typeof value === 'object' && 'token' in value
        ? (value as { token: unknown }).token
        : '';
  return typeof token === 'string' && token.length >= 32 && token.length <= 256
    ? token
    : '';
}

export async function sameCustomerPortalWorkerToken(
  actual: string,
  expected: string,
): Promise<boolean> {
  if (!actual || !expected || actual.length > 256 || expected.length > 256)
    return false;
  const [one, two] = await Promise.all(
    [actual, expected].map((value) =>
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    ),
  );
  const left = new Uint8Array(one),
    right = new Uint8Array(two);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}
