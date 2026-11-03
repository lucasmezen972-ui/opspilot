import { createClient } from 'npm:@supabase/supabase-js@2.55.0';
import { readSmallBody } from '../_shared/mollie.ts';
import {
  parseR2Config,
  R2_FILE_LIMIT,
  R2_STORAGE_LIMIT,
  signR2,
  verifyR2Object,
} from '../_shared/trainingR2.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const admin = createClient(
  url,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);
const cors = {
  'Access-Control-Allow-Origin': 'https://opspilot-mu-six.vercel.app',
  'Access-Control-Allow-Headers':
    'authorization,x-client-info,apikey,content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Cache-Control': 'no-store',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
const uuid = (x: unknown): x is string =>
  typeof x === 'string' &&
  /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST')
    return json({ error: 'Méthode non autorisée' }, 405);
  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace(
      /^Bearer\s+/i,
      '',
    );
    if (!jwt) return json({ error: 'Connexion requise' }, 401);
    const { data: auth, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !auth.user)
      return json({ error: 'Connexion requise' }, 401);
    const user = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    });
    // has_active_profile and table RLS include current suspension/deactivation.
    const { data: active, error: activeError } =
      await user.rpc('has_active_profile');
    if (activeError || !active)
      return json({ error: 'Compte indisponible' }, 403);
    const { data: actor } = await user
      .from('profiles')
      .select('id,role,organization_id')
      .eq('id', auth.user.id)
      .single();
    if (!actor?.organization_id)
      return json({ error: 'Organisation requise' }, 403);
    const { data: allowed, error: rateError } = await admin.rpc(
      'check_ai_rate_limit',
      {
        rate_key: `training-media:${actor.id}`,
        max_requests: 30,
        window_seconds: 60,
      },
    );
    if (rateError || !allowed)
      return json({ error: 'Réessayez dans une minute' }, 429);
    const input = JSON.parse(await readSmallBody(req));
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return json({ error: 'Demande invalide' }, 400);
    const { data: raw, error: configError } = await admin.rpc(
      'get_training_r2_config',
    );
    if (configError)
      return json({ error: 'Stockage temporairement indisponible' }, 503);
    const cfg = parseR2Config(raw);
    if (input.action === 'status')
      return json({
        r2: !!cfg,
        max_bytes: cfg ? R2_FILE_LIMIT : 52428800,
        storage_limit_bytes: cfg ? R2_STORAGE_LIMIT : null,
      });
    if (!cfg)
      return json(
        { error: 'Le stockage vidéo étendu n’est pas encore activé.' },
        503,
      );
    if (input.action === 'playback') {
      if (!uuid(input.chapter_id))
        return json({ error: 'Chapitre invalide' }, 400);
      const { data: chapter, error } = await user
        .from('training_chapters')
        .select('video_storage_path,trainings!inner(is_active,organization_id)')
        .eq('id', input.chapter_id)
        .single();
      const training = Array.isArray(chapter?.trainings)
        ? chapter.trainings[0]
        : chapter?.trainings;
      if (
        error ||
        !chapter?.video_storage_path?.startsWith('r2/') ||
        !training?.is_active ||
        training.organization_id !== actor.organization_id
      )
        return json({ error: 'Vidéo inaccessible' }, 404);
      const { data: upload } = await admin
        .from('training_r2_uploads')
        .select('id')
        .eq('object_path', chapter.video_storage_path)
        .eq('status', 'ready')
        .eq('organization_id', actor.organization_id)
        .eq('chapter_id', input.chapter_id)
        .maybeSingle();
      if (!upload) return json({ error: 'Vidéo inaccessible' }, 404);
      return json({
        signed_url: await signR2(cfg, chapter.video_storage_path, 'GET', 3600),
        expires_in: 3600,
      });
    }
    if (!['admin', 'owner', 'manager', 'superadmin'].includes(actor.role))
      return json({ error: 'Import réservé aux responsables' }, 403);
    if (input.action === 'reserve') {
      if (
        !uuid(input.upload_id) ||
        !uuid(input.course_id) ||
        !uuid(input.chapter_id) ||
        !Number.isSafeInteger(input.size_bytes) ||
        input.size_bytes < 1 ||
        input.size_bytes > R2_FILE_LIMIT
      )
        return json({ error: 'Fichier MP4 de 250 Mo maximum requis' }, 400);
      const { data: u, error } = await admin.rpc('reserve_training_r2_upload', {
        p_actor_id: actor.id,
        p_id: input.upload_id,
        p_course_id: input.course_id,
        p_chapter_id: input.chapter_id,
        p_size: input.size_bytes,
      });
      if (error || !u)
        return json(
          {
            error:
              'Import refusé : vérifiez la formation ou l’espace vidéo disponible.',
          },
          409,
        );
      if (u.status === 'ready')
        return json({ path: u.object_path, ready: true });
      const expires = Math.floor(
        (new Date(u.created_at).getTime() + 1800000 - Date.now()) / 1000,
      );
      if (expires <= 0)
        return json(
          {
            error:
              'Import expiré. Contactez votre administrateur pour vérifier le fichier avant une nouvelle tentative.',
          },
          409,
        );
      return json({
        path: u.object_path,
        upload_url: await signR2(
          cfg,
          u.object_path,
          'PUT',
          Math.min(900, expires),
          u.size_bytes,
        ),
        ready: false,
      });
    }
    if (input.action === 'complete') {
      if (!uuid(input.upload_id))
        return json({ error: 'Import invalide' }, 400);
      const { data: u } = await admin
        .from('training_r2_uploads')
        .select('*')
        .eq('id', input.upload_id)
        .eq('actor_id', actor.id)
        .eq('organization_id', actor.organization_id)
        .maybeSingle();
      if (!u) return json({ error: 'Import inaccessible' }, 404);
      if (u.status !== 'ready') {
        await verifyR2Object(cfg, u.object_path, u.size_bytes);
        const { error } = await admin
          .from('training_r2_uploads')
          .update({ status: 'ready', verified_at: new Date().toISOString() })
          .eq('id', u.id)
          .eq('status', 'reserved');
        if (error)
          return json({ error: 'Validation de l’import indisponible' }, 503);
      }
      return json({ path: u.object_path, ready: true });
    }
    return json({ error: 'Action inconnue' }, 400);
  } catch (error) {
    if (error instanceof SyntaxError)
      return json({ error: 'Demande invalide' }, 400);
    if (error instanceof Error && error.message === 'body_too_large')
      return json({ error: 'Demande trop volumineuse' }, 413);
    return json(
      {
        error:
          'Le fichier privé n’a pas pu être vérifié. Réessayez sans créer un nouvel import.',
      },
      503,
    );
  }
});
