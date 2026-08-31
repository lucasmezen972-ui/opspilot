import { X } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';

interface CreateAuditModalProps {
  visible: boolean;
  title: string;
  selectedTemplateName: string | null;
  onChangeTitle: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

/** Modale de création d'un audit : titre et rappel du modèle choisi. */
export function CreateAuditModal({
  visible,
  title,
  selectedTemplateName,
  onChangeTitle,
  onClose,
  onConfirm,
}: CreateAuditModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Nouvel audit</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TextInput
            testID="audit-create-title-input"
            style={styles.input}
            value={title}
            onChangeText={onChangeTitle}
            placeholder="Titre de l'audit"
            autoFocus
          />
          <Text style={styles.templateText}>
            {selectedTemplateName
              ? `Modèle : ${selectedTemplateName}`
              : 'Audit libre : questionnaire standard à la clôture'}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="audit-create-submit"
              style={[styles.confirmButton, !title.trim() && { opacity: 0.5 }]}
              disabled={!title.trim()}
              onPress={onConfirm}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  templateText: {
    marginTop: -6,
    marginBottom: 16,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
