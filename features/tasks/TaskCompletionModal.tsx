import { Camera, Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { isCompletionValid } from './taskTraceability';
import CameraModal from '../../components/CameraModal';
import type { Task } from '../../lib/supabase';
import { AppInput } from '../../shared/components/AppInput';
import { AppModal } from '../../shared/components/AppModal';
import { colors, radius, spacing } from '../../shared/styles/tokens';
import type { TaskCompletionInput } from './taskTraceability';

type Props = {
  visible: boolean;
  task: Task | null;
  defaultName: string;
  onClose: () => void;
  onConfirm: (input: TaskCompletionInput) => void;
};

/** Clôture traçable d'une tâche : exécutant, matricule, commentaire, preuve. */
export function TaskCompletionModal({
  visible,
  task,
  defaultName,
  onClose,
  onConfirm,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [matricule, setMatricule] = useState('');
  const [comment, setComment] = useState('');
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(defaultName);
      setMatricule('');
      setComment('');
      setProofPhotoUrl(null);
    }
  }, [visible, defaultName, task?.id]);

  const input: TaskCompletionInput = {
    executantName: name,
    matricule,
    comment,
    proofPhotoUrl,
  };
  const valid = isCompletionValid(input);

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Clôture de la tâche"
      testID="task-completion-modal"
    >
      {task && (
        <Text style={styles.subject} numberOfLines={2}>
          {task.title}
        </Text>
      )}

      <AppInput
        testID="task-completion-name"
        label="Réalisé par *"
        value={name}
        onChangeText={setName}
        placeholder="Nom et prénom"
      />
      <AppInput
        testID="task-completion-matricule"
        label="Matricule *"
        value={matricule}
        onChangeText={setMatricule}
        placeholder="Ex. M-1042"
        autoCapitalize="characters"
      />
      <AppInput
        testID="task-completion-comment"
        label="Commentaire"
        value={comment}
        onChangeText={setComment}
        placeholder="Observation, écart, point de vigilance…"
        multiline
      />

      <TouchableOpacity
        testID="task-completion-photo"
        style={styles.photoButton}
        onPress={() => setCameraVisible(true)}
      >
        <Camera size={16} color={colors.primary} />
        <Text style={styles.photoButtonText}>
          {proofPhotoUrl ? 'Preuve jointe' : 'Joindre une preuve photo'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="task-completion-submit"
        style={[styles.submit, !valid && styles.submitDisabled]}
        disabled={!valid}
        onPress={() => onConfirm(input)}
      >
        <Check size={18} color={colors.surface} />
        <Text style={styles.submitText}>Clôturer et tracer</Text>
      </TouchableOpacity>

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onPhotoTaken={(uri) => {
          setProofPhotoUrl(uri);
          setCameraVisible(false);
        }}
      />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  subject: {
    fontSize: 14,
    color: colors.textMuted,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  photoButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: radius.md,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
});
