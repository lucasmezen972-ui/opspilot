import { useRef } from 'react';
import { Text, View } from 'react-native';

import { validateTrainingVideoFile } from './video';
import { AppButton } from '../../shared/components/AppButton';
export function TrainingVideoFilePicker({
  onChoose,
  onError,
}: {
  onChoose: (file: File, duration: number) => void;
  onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <View style={{ gap: 6 }}>
      <input
        ref={input}
        type="file"
        accept="video/mp4,.mp4"
        aria-label="Fichier vidéo MP4"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = '';
          if (!file) return;
          const error = validateTrainingVideoFile(file);
          if (error) {
            onError(error);
            return;
          }
          const video = document.createElement('video');
          const url = URL.createObjectURL(file);
          const cleanup = () => {
            video.onloadedmetadata = null;
            video.onerror = null;
            URL.revokeObjectURL(url);
            video.removeAttribute('src');
            video.load();
          };
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            const duration = Math.ceil(video.duration);
            cleanup();
            if (!Number.isFinite(duration) || duration < 1 || duration > 7200)
              onError('La vidéo doit durer entre une seconde et deux heures.');
            else onChoose(file, duration);
          };
          video.onerror = () => {
            cleanup();
            onError(
              'Ce fichier vidéo ne peut pas être lu. Exportez-le en MP4 H.264.',
            );
          };
          video.src = url;
        }}
      />
      <AppButton
        label="Importer un fichier MP4"
        variant="secondary"
        onPress={() => input.current?.click()}
      />
      <Text style={{ fontSize: 12, color: '#64748B' }}>
        50 Mo maximum. Le fichier reste privé à votre organisation.
      </Text>
    </View>
  );
}
