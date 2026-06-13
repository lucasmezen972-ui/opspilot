import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';

import { getPriorityColor, getPriorityText } from './taskModel';
import { colors, radius } from '../../shared/styles/tokens';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NewTaskDraft {
  title: string;
  description: string;
  priority: TaskPriority;
}

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: NewTaskDraft) => void;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

/** Modale de création d'une tâche : titre, description et priorité. */
export function CreateTaskModal({
  visible,
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  // Réinitialise le formulaire à chaque ouverture.
  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setPriority('medium');
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Nouvelle tâche</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Titre de la tâche"
            autoFocus
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optionnel)"
            multiline
          />
          <View style={styles.prioritySelector}>
            {PRIORITIES.map((p) => {
              const active = priority === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    active && {
                      backgroundColor: getPriorityColor(p),
                      borderColor: getPriorityColor(p),
                    },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      active && styles.priorityOptionTextActive,
                    ]}
                  >
                    {getPriorityText(p)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onSubmit({ title, description, priority })}
            >
              <Text style={styles.confirmText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textStrong,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  priorityOptionTextActive: {
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
