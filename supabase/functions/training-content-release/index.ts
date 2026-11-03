import { createClient } from 'npm:@supabase/supabase-js@2.55.0';

// Operational importer, separate from learner and client uploads. The owner
// authorizes a fixed SHA-256/size/path through the connected database tool.
// Each opaque release capability expires, cannot choose a path, and cannot read
// private content. Only its SHA-256 is stored. Never log request headers/body.
const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);
const reply = (status: number, result: string) =>
  new Response(JSON.stringify({ result }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
const digest = async (bytes: Uint8Array) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice().buffer)),
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, 'method_not_allowed');
  const token = req.headers.get('x-opspilot-release-token') ?? '';
  if (!/^[a-f0-9]{64}$/.test(token)) return reply(401, 'unauthorized');
  try {
    const tokenHash = await digest(new TextEncoder().encode(token));
    const { data: job, error } = await admin.rpc('get_training_media_release', {
      p_token_hash: tokenHash,
    });
    if (error) return reply(503, 'release_unavailable');
    if (!job) return reply(401, 'unauthorized');
    if (job.complete) return reply(200, 'already_imported');
    const size = Number(job.size_bytes);
    if (
      !Number.isSafeInteger(size) ||
      size < 1 ||
      size > 52428800 ||
      !/^library\/[0-9-]+\/[a-z0-9-]+\/[a-f0-9]{64}\.mp4$/.test(job.path) ||
      !/^[a-f0-9]{64}$/.test(job.sha256)
    )
      return reply(503, 'release_unavailable');
    if (req.headers.get('content-type') !== 'video/mp4')
      return reply(415, 'mp4_required');
    if (Number(req.headers.get('content-length')) !== size)
      return reply(413, 'size_mismatch');
    const reader = req.body?.getReader();
    if (!reader) return reply(400, 'body_required');
    const bytes = new Uint8Array(size);
    let offset = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (offset + chunk.value.length > size) {
        await reader.cancel();
        return reply(413, 'size_mismatch');
      }
      bytes.set(chunk.value, offset);
      offset += chunk.value.length;
    }
    if (offset !== size || (await digest(bytes)) !== job.sha256)
      return reply(422, 'integrity_mismatch');
    const { error: uploadError } = await admin.storage
      .from('training-library')
      .upload(job.path, bytes, { contentType: 'video/mp4', upsert: false });
    if (uploadError) {
      // A lost response or concurrent retry may have stored the same object.
      // Prove the existing bytes match; never overwrite an immutable version.
      const existing = await admin.storage
        .from('training-library')
        .download(job.path);
      if (
        existing.error ||
        !existing.data ||
        existing.data.size !== size ||
        (await digest(new Uint8Array(await existing.data.arrayBuffer()))) !==
          job.sha256
      )
        return reply(503, 'upload_unavailable');
    }
    const done = await admin.rpc('complete_training_media_release', {
      p_token_hash: tokenHash,
    });
    return done.error
      ? reply(503, 'confirmation_unavailable')
      : reply(200, 'imported');
  } catch {
    return reply(503, 'release_unavailable');
  }
});
