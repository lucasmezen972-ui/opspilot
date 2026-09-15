import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { PRIORITY_COLORS, PRIORITY_LABELS } from './constants';
import type { CorrectiveAction } from '../../lib/supabase';
import { AppInput } from '../../shared/components/AppInput';
import { AppModal } from '../../shared/components/AppModal';
import { colors, radius, spacing } from '../../shared/styles/tokens';

export interface NewActionPayload {
  title: string;
  description: string | null;
  priority: CorrectiveAction['priority'];
  due_date: string | null;
}

interface CreateActionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: NewActionPayload) => Promise<void> | void;
}

export function CreateActionModal({
  visible,
  onClose,
  onCreate,
}: CreateActionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] =
    useState<CorrectiveAction['priority']>('medium');
  const [dueDays, setDueDays] = useState('7');

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDays('7');
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const days = parseInt(dueDays, 10);
    await onCreate({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: Number.isFinite(days)
        ? new Date(Date.now() + days * 86400000).toISOString()
        : null,
    });
    reset();
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Nouvelle action corrective"
    >
      <View style={styles.field}>
        <AppInput
          testID="action-create-title"
          placeholder="Titre de l'action *"
          value={title}
          onChangeText={setTitle}
        />
      </View>
      <View style={styles.field}>
        <AppInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <Text style={styles.fieldLabel}>Priorité</Text>
      <View style={styles.priorityRow}>
        {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.priorityOption,
              priority === p && {
                backgroundColor: PRIORITY_COLORS[p] + '22',
                borderColor: PRIORITY_COLORS[p],
              },
            ]}
            onPress={() => setPriority(p)}
          >
            <Text
              style={[
                styles.priorityOptionText,
                priority === p && { color: PRIORITY_COLORS[p] },
              ]}
            >
              {PRIORITY_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.field}>
        <AppInput
          label="Échéance (jours)"
          placeholder="7"
          value={dueDays}
          onChangeText={setDueDays}
          keyboardType="number-pad"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          !title.trim() && styles.submitButtonDisabled,
        ]}
        testID="action-create-submit"
        onPress={handleSubmit}
        disabled={!title.trim()}
      >
        <Text style={styles.submitButtonText}>Créer l'action</Text>
      </TouchableOpacity>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
