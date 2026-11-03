import { describe, expect, it } from 'vitest';

import {
  canCompleteVideo,
  isTrainingMediaUrl,
  validateTrainingVideoFile,
  MAX_R2_VIDEO_BYTES,
} from '../../../features/training/video';

describe('training video boundaries', () => {
  it('allows larger MP4 files only when extended storage is available', () => {
    const video = {
      name: 'lesson.mp4',
      type: 'video/mp4',
      size: 60 * 1024 * 1024,
    };
    expect(validateTrainingVideoFile(video)).toBeTruthy();
    expect(validateTrainingVideoFile(video, MAX_R2_VIDEO_BYTES)).toBeNull();
    expect(
      validateTrainingVideoFile(
        { ...video, size: MAX_R2_VIDEO_BYTES + 1 },
        MAX_R2_VIDEO_BYTES,
      ),
    ).toBeTruthy();
    expect(
      validateTrainingVideoFile({ ...video, size: -1 }, MAX_R2_VIDEO_BYTES),
    ).toBeTruthy();
  });
  it('accepts secure MP4 and VTT files including signed URLs', () => {
    expect(
      isTrainingMediaUrl('https://cdn.example.org/lesson.mp4?token=abc'),
    ).toBe(true);
    expect(
      isTrainingMediaUrl('https://cdn.example.org/subtitles.vtt', 'vtt'),
    ).toBe(true);
  });
  it.each([
    // eslint-disable-next-line no-script-url -- Explicit malicious input to the URL validator.
    'javascript:alert(1)',
    'http://cdn.example.org/lesson.mp4',
    'https://user:password@example.org/lesson.mp4',
    'https://localhost/lesson.mp4',
    'https://cdn.example.org/page.html',
  ])('rejects unsafe or non-video source %s', (url) =>
    expect(isTrainingMediaUrl(url)).toBe(false),
  );
  it('rejects oversized or disguised uploads', () => {
    expect(
      validateTrainingVideoFile({
        name: 'lesson.mp4',
        type: 'video/mp4',
        size: 50 * 1024 * 1024 + 1,
      }),
    ).toBeTruthy();
    expect(
      validateTrainingVideoFile({
        name: 'lesson.html',
        type: 'video/mp4',
        size: 100,
      }),
    ).toBeTruthy();
    expect(
      validateTrainingVideoFile({
        name: 'lesson.mp4',
        type: 'video/mp4',
        size: 100,
      }),
    ).toBeNull();
  });
  it('requires 90 percent of a video and leaves text lessons usable', () => {
    const video = {
      id: 'x',
      training_id: 't',
      title: 'A',
      body: '',
      sort_order: 0,
      video_url: 'https://example.org/lesson.mp4',
      video_duration_seconds: 100,
    };
    expect(canCompleteVideo(video, 89)).toBe(false);
    expect(canCompleteVideo(video, 90)).toBe(true);
    expect(canCompleteVideo({ ...video, video_url: null })).toBe(true);
  });
});
