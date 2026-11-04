import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getPriorityColor, getPriorityText } from './taskModel';
import { RECURRENCE_OPTIONS, type Recurrence } from './taskRecurrence';
import { AppButton } from '../../shared/components/AppButton';
import { AppInput } from '../../shared/components/AppInput';
import { AppModal } from '../../shared/components/AppModal';
import { AppRadioGroup } from '../../shared/components/AppRadioGroup';
import { colors } from '../../shared/styles/tokens';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NewTaskDraft {
  title: string;
  description: string;
  priority: TaskPriority;
  recurrence: Recurrence;
}

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: NewTaskDraft) => void;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

/** Named form with persistent labels and one keyboard stop per choice group. */
export function CreateTaskModal({
  visible,
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setRecurrence('none');
    }
  }, [visible]);
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Nouvelle tâche"
      testID="task-create-modal"
      closeLabel="Fermer la création de tâche"
      maxWidth={440}
      scrollable
    >
      <Text style={styles.hint}>
        Le titre est obligatoire. Les autres choix peuvent être ajustés avant de
        créer la tâche.
      </Text>
      <AppInput
        label="Titre de la tâche"
        placeholder="Titre de la tâche"
        value={title}
        onChangeText={setTitle}
        required
        autoFocus
        testID="task-create-title"
      />
      <AppInput
        label="Description (optionnel)"
        placeholder="Description (optionnel)"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <AppRadioGroup
        label="Priorité"
        value={priority}
        onChange={setPriority}
        choices={PRIORITIES.map((key) => ({
          key,
          label: getPriorityText(key),
          selectedColor: getPriorityColor(key),
        }))}
      />
      <AppRadioGroup
        label="Récurrence"
        value={recurrence}
        onChange={setRecurrence}
        choices={RECURRENCE_OPTIONS.map((option) => ({
          key: option.value,
          label: option.label,
          testID: `task-recurrence-${option.value}`,
        }))}
      />
      <View style={styles.actions}>
        <AppButton
          label="Annuler"
          variant="secondary"
          fullWidth={false}
          style={{ flex: 1 }}
          onPress={onClose}
        />
        <AppButton
          label="Créer"
          testID="task-create-submit"
          fullWidth={false}
          style={{ flex: 1 }}
          disabled={!title.trim()}
          onPress={() => onSubmit({ title, description, priority, recurrence })}
        />
      </View>
    </AppModal>
  );
}
const styles = StyleSheet.create({
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 12 },
});
