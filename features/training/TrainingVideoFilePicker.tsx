import { Text } from 'react-native';
export function TrainingVideoFilePicker(_props: {
  onChoose: (file: File, duration: number) => void;
  onError: (message: string) => void;
  maxBytes?: number;
}) {
  return (
    <Text>
      Importez un fichier depuis la version web ou utilisez un lien MP4
      ci-dessous.
    </Text>
  );
}
