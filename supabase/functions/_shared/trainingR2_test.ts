import { parseR2Config, signR2, verifyR2Object } from './trainingR2.ts';
const cfg = {
  accountId: 'a'.repeat(32),
  bucket: 'opspilot-test-videos',
  accessKeyId: 'fixture-key',
  secretAccessKey: 'fixture-secret',
};
const id = '10000000-0000-4000-a000-000000000001';
const path = `r2/${id}/${id}/${id}/${id}.mp4`;
function assert(x: unknown, msg = 'assertion failed'): asserts x {
  if (!x) throw new Error(msg);
}
async function rejects(f: () => Promise<unknown>) {
  let failed = false;
  try {
    await f();
  } catch {
    failed = true;
  }
  assert(failed, 'expected rejection');
}
Deno.test(
  'R2 only accepts enabled configuration and fixed account endpoints',
  async () => {
    assert(parseR2Config(cfg) === null);
    assert(parseR2Config({ ...cfg, enabled: true }) !== null);
    assert(
      parseR2Config({
        ...cfg,
        enabled: true,
        accountId: 'attacker.example',
      }) === null,
    );
    assert(
      parseR2Config({ ...cfg, enabled: true, bucket: '../other' }) === null,
    );
    await rejects(() => signR2(cfg, '../other', 'GET', 60));
  },
);
Deno.test(
  'R2 upload signature binds size, MIME and no-overwrite header',
  async () => {
    const url = new URL(await signR2(cfg, path, 'PUT', 900, 3618));
    assert(url.hostname === `${cfg.accountId}.r2.cloudflarestorage.com`);
    assert(url.searchParams.get('X-Amz-Expires') === '900');
    const headers = url.searchParams.get('X-Amz-SignedHeaders') ?? '';
    for (const h of ['content-length', 'content-type', 'if-none-match', 'host'])
      assert(headers.split(';').includes(h), `missing ${h}`);
    const different = await signR2(cfg, path, 'PUT', 900, 3619);
    assert(
      new URL(different).searchParams.get('X-Amz-Signature') !==
        url.searchParams.get('X-Amz-Signature'),
    );
    await rejects(() => signR2(cfg, path, 'PUT', 900, 262144001));
    const read = new URL(await signR2(cfg, path, 'GET', 3600));
    assert(read.searchParams.get('X-Amz-Expires') === '3600');
  },
);
Deno.test(
  'R2 completion checks provider length and actual MP4 signature',
  async () => {
    const original = globalThis.fetch;
    let valid = true;
    let calls = 0;
    globalThis.fetch = async (_request, init) => {
      calls++;
      if (init?.method === 'HEAD')
        return new Response(null, {
          status: 200,
          headers: { 'Content-Type': 'video/mp4', 'Content-Length': '3618' },
        });
      assert(new Headers(init?.headers).get('range') === 'bytes=0-31');
      return new Response(
        new TextEncoder().encode(
          valid ? '0000ftypisom0000' : '0000htmlnotvideo',
        ),
        { status: 206 },
      );
    };
    try {
      await verifyR2Object(cfg, path, 3618);
      assert(calls === 2);
      await rejects(() => verifyR2Object(cfg, path, 4000));
      valid = false;
      await rejects(() => verifyR2Object(cfg, path, 3618));
    } finally {
      globalThis.fetch = original;
    }
  },
);
Deno.test('R2 never buffers a full video when Range is ignored', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_request, init) =>
    init?.method === 'HEAD'
      ? new Response(null, {
          status: 200,
          headers: { 'Content-Type': 'video/mp4', 'Content-Length': '3618' },
        })
      : new Response('full object', { status: 200 });
  try {
    await rejects(() => verifyR2Object(cfg, path, 3618));
  } finally {
    globalThis.fetch = original;
  }
});
