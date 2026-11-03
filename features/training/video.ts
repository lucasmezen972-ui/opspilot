import type { TrainingChapter } from '../../lib/supabase';

export const MAX_TRAINING_VIDEO_BYTES = 50 * 1024 * 1024;
export function isTrainingMediaUrl(
  value: string,
  extension: 'mp4' | 'vtt' = 'mp4',
): boolean {
  try {
    const url = new URL(value);
    return (
      value.length <= 2048 &&
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      url.pathname.toLowerCase().endsWith(`.${extension}`)
    );
  } catch {
    return false;
  }
}
export function validateTrainingVideoFile(file: {
  size: number;
  type: string;
  name: string;
}): string | null {
  if (!file.size || file.size > MAX_TRAINING_VIDEO_BYTES)
    return 'Choisissez une vidéo MP4 de 50 Mo maximum.';
  if (file.type !== 'video/mp4' || !file.name.toLowerCase().endsWith('.mp4'))
    return 'Le format attendu est MP4.';
  return null;
}
export function hasTrainingVideo(chapter?: TrainingChapter): boolean {
  return Boolean(chapter?.video_url) || Boolean(chapter?.video_storage_path);
}
export function canCompleteVideo(
  chapter: TrainingChapter,
  watched = 0,
): boolean {
  return (
    !hasTrainingVideo(chapter) ||
    watched >= (chapter.video_duration_seconds ?? Infinity) * 0.9
  );
}

export interface TrainingVideoPlayerProps {
  src: string;
  title: string;
  position: number;
  captionsUrl?: string | null;
  onProgress: (seconds: number) => void;
  onError: () => void;
}
