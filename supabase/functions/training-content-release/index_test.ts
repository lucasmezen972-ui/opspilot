// Offline operational-import checks. All provider requests are intercepted;
// the token, object and credentials below are fictional, never live values.
let handler: (request: Request) => Promise<Response>;
const serve = Deno.serve;
Deno.serve = ((h: typeof handler) => {
  handler = h;
}) as unknown as typeof Deno.serve;
Deno.env.set('SUPABASE_URL', 'https://release-fixture.example.invalid');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'fixture_not_a_real_key');
const bytes = new Uint8Array([1, 2, 3, 4]);
const hash = Array.from(
  new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
)
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('');
const path = `library/2026-11-03/fixture/${hash}.mp4`;
let exists = true,
  complete = false,
  uploads = 0,
  completions = 0,
  conflict = false,
  corruptStored = false;
const fetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input),
    method = init?.method ?? 'GET';
  if (url.endsWith('/rpc/get_training_media_release'))
    return Response.json(
      exists ? { path, sha256: hash, size_bytes: 4, complete } : null,
    );
  if (url.endsWith('/rpc/complete_training_media_release')) {
    complete = true;
    completions++;
    return Response.json(null);
  }
  if (url.includes('/storage/v1/object/') && method === 'POST') {
    uploads++;
    return conflict
      ? Response.json({ message: 'exists', statusCode: 409 }, { status: 409 })
      : Response.json({ Key: path });
  }
  if (url.includes('/storage/v1/object/') && method === 'GET')
    return new Response(corruptStored ? new Uint8Array([9, 9, 9, 9]) : bytes, {
      headers: { 'Content-Type': 'video/mp4' },
    });
  throw new Error('Unexpected fixture request');
};
await import('./index.ts');
Deno.serve = serve;
const request = (
  body: Uint8Array<ArrayBuffer> = bytes,
  overrides: Record<string, string> = {},
) =>
  new Request('https://release-fixture.example.invalid/import', {
    method: 'POST',
    headers: {
      'x-opspilot-release-token': 'a'.repeat(64),
      'Content-Type': 'video/mp4',
      'Content-Length': String(body.length),
      ...overrides,
    },
    body,
  });
const equal = (actual: unknown, expected: unknown) => {
  if (actual !== expected)
    throw new Error(`Expected ${expected}, received ${actual}`);
};
Deno.test(
  'release capability, byte integrity and immutable retries',
  async (t) => {
    try {
      await t.step(
        'rejects missing, malformed and unavailable capabilities',
        async () => {
          equal(
            (
              await handler(
                new Request('https://example.invalid', { method: 'GET' }),
              )
            ).status,
            405,
          );
          equal(
            (await handler(request(bytes, { 'x-opspilot-release-token': '' })))
              .status,
            401,
          );
          exists = false;
          equal((await handler(request())).status, 401);
          exists = true;
          equal(uploads, 0);
        },
      );
      await t.step(
        'rejects wrong type, declared size and SHA-256 before upload',
        async () => {
          equal(
            (await handler(request(bytes, { 'Content-Type': 'text/plain' })))
              .status,
            415,
          );
          equal(
            (await handler(request(bytes, { 'Content-Length': '8' }))).status,
            413,
          );
          equal(
            (await handler(request(new Uint8Array([4, 3, 2, 1])))).status,
            422,
          );
          equal(uploads, 0);
          equal(completions, 0);
        },
      );
      await t.step(
        'stores the allowed bytes once and makes a retry idempotent',
        async () => {
          equal((await handler(request())).status, 200);
          equal(uploads, 1);
          equal(completions, 1);
          equal((await handler(request())).status, 200);
          equal(uploads, 1);
          equal(completions, 1);
        },
      );
      await t.step(
        'checks existing bytes after a lost upload response',
        async () => {
          complete = false;
          conflict = true;
          corruptStored = true;
          equal((await handler(request())).status, 503);
          equal(completions, 1);
          corruptStored = false;
          equal((await handler(request())).status, 200);
          equal(completions, 2);
        },
      );
    } finally {
      globalThis.fetch = fetch;
    }
  },
);
