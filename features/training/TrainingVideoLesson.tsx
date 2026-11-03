import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { TrainingVideoPlayer } from './TrainingVideoPlayer';
import { isTrainingMediaUrl } from './video';
import { supabase, type TrainingChapter } from '../../lib/supabase';

export function TrainingVideoLesson({
  chapter,
  position,
  onProgress,
  chapters,
}: {
  chapter: TrainingChapter;
  position: number;
  onProgress: (seconds: number) => Promise<{ error?: unknown }>;
  chapters?: { title: string; seconds: number }[];
}) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const pending = useRef<number | null>(null);
  useEffect(() => {
    let active = true;
    setSrc('');
    setError('');
    const load = async () => {
      if (chapter.video_storage_path) {
        if (chapter.video_storage_path.startsWith('r2/')) {
          const { data, error: issue } = await supabase.functions.invoke(
            'training-media',
            {
              body: { action: 'playback', chapter_id: chapter.id },
            },
          );
          if (active) {
            if (issue || typeof data?.signed_url !== 'string')
              setError('La vidéo est momentanément indisponible.');
            else setSrc(data.signed_url);
          }
          return;
        }
        const { data, error: issue } = await supabase.storage
          .from(
            chapter.video_storage_path.startsWith('library/')
              ? 'training-library'
              : 'training-videos',
          )
          .createSignedUrl(chapter.video_storage_path, 3600);
        if (active) {
          if (issue !== null || !data?.signedUrl)
            setError('La vidéo est momentanément indisponible.');
          else setSrc(data.signedUrl);
        }
      } else if (chapter.video_url && isTrainingMediaUrl(chapter.video_url))
        setSrc(chapter.video_url);
      else setError('Le lien vidéo doit être un fichier MP4 sécurisé.');
    };
    load().catch(() => {
      if (active)
        setError('Impossible de charger la vidéo. Vérifiez votre connexion.');
    });
    return () => {
      active = false;
    };
  }, [chapter.id, chapter.video_storage_path, chapter.video_url, attempt]);
  return (
    <View
      style={{ gap: 10, marginVertical: 16 }}
      testID="training-video-lesson"
    >
      {src && !error && (
        <TrainingVideoPlayer
          key={src}
          src={src}
          title={chapter.title}
          position={position}
          captionsUrl={chapter.captions_url}
          chapters={chapters}
          onError={() =>
            setError('Lecture interrompue. Réessayez pour reprendre la vidéo.')
          }
          onProgress={(seconds) => {
            pending.current = seconds;
            if (busy.current) return;
            busy.current = true;
            const save = async () => {
              while (pending.current !== null) {
                const next = pending.current;
                pending.current = null;
                const result = await onProgress(next);
                if (result.error)
                  setError(
                    'La progression n’a pas été enregistrée. Vérifiez votre connexion puis réessayez.',
                  );
              }
            };
            save()
              .catch(() => setError('La progression n’a pas été enregistrée.'))
              .finally(() => {
                busy.current = false;
              });
          }}
        />
      )}
      {!src && !error && <Text>Chargement de la vidéo…</Text>}
      {error && (
        <>
          <Text accessibilityRole="alert">{error}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setAttempt((n) => n + 1)}
            style={{ padding: 12 }}
          >
            <Text>Réessayer</Text>
          </TouchableOpacity>
        </>
      )}
      <Text style={{ color: '#64748B', fontSize: 13 }}>
        Reprise automatique de la lecture. Regardez 90 % de la vidéo pour
        valider le chapitre.
      </Text>
      <Text
        testID="training-video-position"
        style={{ color: '#64748B', fontSize: 13 }}
      >
        Position enregistrée : {Math.round(position)} s
      </Text>
    </View>
  );
}
