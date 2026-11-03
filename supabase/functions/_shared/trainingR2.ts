import { AwsClient } from 'npm:aws4fetch@1.0.20';

export const R2_FILE_LIMIT = 262144000;
export const R2_STORAGE_LIMIT = 8000000000;
export type R2Config = {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};
export function parseR2Config(value: unknown): R2Config | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (
    v.enabled !== true ||
    typeof v.accountId !== 'string' ||
    !/^[a-f0-9]{32}$/.test(v.accountId) ||
    typeof v.bucket !== 'string' ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(v.bucket) ||
    typeof v.accessKeyId !== 'string' ||
    !v.accessKeyId ||
    typeof v.secretAccessKey !== 'string' ||
    !v.secretAccessKey
  )
    return null;
  return v as unknown as R2Config;
}
export function r2ObjectUrl(cfg: R2Config, path: string) {
  if (
    !/^r2\/[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.mp4$/.test(
      path,
    )
  )
    throw new Error('invalid_object_path');
  return `https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucket}/${path}`;
}
export async function signR2(
  cfg: R2Config,
  path: string,
  method: 'GET' | 'HEAD' | 'PUT',
  expires: number,
  size?: number,
) {
  const headers: Record<string, string> = {};
  if (method === 'PUT') {
    if (!Number.isSafeInteger(size) || size! < 1 || size! > R2_FILE_LIMIT)
      throw new Error('invalid_file_size');
    // Browsers derive Content-Length from the File body. Signing it prevents
    // a stolen upload URL from storing a larger object than its reservation.
    headers['Content-Length'] = String(size);
    headers['Content-Type'] = 'video/mp4';
    headers['If-None-Match'] = '*';
  }
  const client = new AwsClient({
    ...cfg,
    service: 's3',
    region: 'auto',
    retries: 0,
  });
  const request = await client.sign(
    `${r2ObjectUrl(cfg, path)}?X-Amz-Expires=${Math.max(1, Math.min(3600, Math.floor(expires)))}`,
    {
      method,
      headers,
      aws: { signQuery: true, allHeaders: true },
    },
  );
  return request.url;
}
export async function verifyR2Object(
  cfg: R2Config,
  path: string,
  size: number,
) {
  const head = await fetch(await signR2(cfg, path, 'HEAD', 60), {
    method: 'HEAD',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });
  if (
    !head.ok ||
    head.headers.get('content-type')?.split(';')[0] !== 'video/mp4' ||
    Number(head.headers.get('content-length')) !== size
  )
    throw new Error('object_not_verified');
  const response = await fetch(await signR2(cfg, path, 'GET', 60), {
    headers: { Range: 'bytes=0-31' },
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });
  // Never buffer a full object if a provider ignores the requested range.
  if (response.status !== 206) {
    await response.body?.cancel();
    throw new Error('invalid_media');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('invalid_media');
  const prefix = new Uint8Array(12);
  let count = 0;
  try {
    while (count < prefix.length) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = value.subarray(0, prefix.length - count);
      prefix.set(chunk, count);
      count += chunk.length;
    }
  } finally {
    await reader.cancel();
  }
  if (count < 12 || new TextDecoder().decode(prefix.subarray(4, 8)) !== 'ftyp')
    throw new Error('invalid_media');
}
