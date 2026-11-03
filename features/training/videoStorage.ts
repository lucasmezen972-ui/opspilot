import { supabase } from '../../lib/supabase';

export async function uploadR2Video(input: {
  uploadId: string;
  courseId: string;
  chapterId: string;
  file: File;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke('training-media', {
    body: {
      action: 'reserve',
      upload_id: input.uploadId,
      course_id: input.courseId,
      chapter_id: input.chapterId,
      size_bytes: input.file.size,
    },
  });
  if (error || data?.error || typeof data?.path !== 'string')
    throw new Error(data?.error || 'Le stockage vidéo est indisponible.');
  if (!data.ready) {
    // Only the signed storage request goes to R2: never forward the user's JWT.
    const target = new URL(data.upload_url);
    if (
      target.protocol !== 'https:' ||
      !/^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/.test(target.hostname)
    )
      throw new Error('Destination vidéo invalide.');
    const response = await fetch(target.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'video/mp4', 'If-None-Match': '*' },
      body: input.file,
      credentials: 'omit',
      redirect: 'error',
    });
    // A previous PUT may have succeeded despite a lost response. Ask the server
    // to verify the existing object; never overwrite or delete it speculatively.
    if (!response.ok && response.status !== 412)
      throw new Error(
        'Import interrompu. Réessayez pour reprendre cette tentative.',
      );
    const complete = await supabase.functions.invoke('training-media', {
      body: { action: 'complete', upload_id: input.uploadId },
    });
    if (
      complete.error ||
      !complete.data?.ready ||
      complete.data?.path !== data.path
    )
      throw new Error(
        'Le fichier doit encore être vérifié. Réessayez cette tentative.',
      );
  }
  return data.path;
}
