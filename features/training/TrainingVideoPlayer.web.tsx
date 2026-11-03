import { useEffect, useRef } from 'react';

import type { TrainingVideoPlayerProps } from './video';

/** Native browser controls support keyboard use, fullscreen and caption tracks. */
export function TrainingVideoPlayer({
  src,
  title,
  position,
  captionsUrl,
  onProgress,
  onError,
}: TrainingVideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const lastSent = useRef(0);
  const resume = useRef(position);
  useEffect(() => {
    const element = ref.current;
    return () => {
      element?.pause();
    };
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      controls
      playsInline
      preload="metadata"
      aria-label={title}
      style={{
        width: '100%',
        maxHeight: 420,
        aspectRatio: '16 / 9',
        background: '#0B1220',
        borderRadius: 12,
      }}
      onLoadedMetadata={() => {
        if (ref.current) {
          if (resume.current > 0)
            ref.current.currentTime = Math.min(
              resume.current,
              ref.current.duration,
            );
          onProgress(ref.current.currentTime);
        }
      }}
      onTimeUpdate={() => {
        const v = ref.current;
        if (v && !v.paused && Date.now() - lastSent.current >= 5000) {
          lastSent.current = Date.now();
          onProgress(v.currentTime);
        }
      }}
      onPause={() => {
        if (ref.current) onProgress(ref.current.currentTime);
      }}
      onEnded={() => {
        if (ref.current) onProgress(ref.current.currentTime);
      }}
      onError={onError}
    >
      {captionsUrl && (
        <track
          kind="captions"
          src={captionsUrl}
          srcLang="fr"
          label="Français"
          default
        />
      )}
      Votre navigateur ne prend pas en charge cette vidéo.
    </video>
  );
}
