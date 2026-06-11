import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';

import { PRIORITY_COLORS, PRIORITY_LABELS } from './constants';
import type { CorrectiveAction } from '../../lib/supabase';

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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle action corrective</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TextInput
            testID="action-create-title"
            style={styles.input}
            placeholder="Titre de l'action *"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Description"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
          />

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

          <Text style={styles.fieldLabel}>Échéance (jours)</Text>
          <TextInput
            style={styles.input}
            placeholder="7"
            placeholderTextColor="#9CA3AF"
            value={dueDays}
            onChangeText={setDueDays}
            keyboardType="number-pad"
          />

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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
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
