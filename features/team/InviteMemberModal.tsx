import { X, ChevronDown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { INVITE_ROLES, getRoleLabel } from './teamModel';
import type { Invitation } from '../../lib/supabase';

interface InviteMemberModalProps {
  visible: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (email: string, role: Invitation['role']) => void;
}

/** Modale d'invitation : saisie e-mail, choix du rôle et envoi. */
export function InviteMemberModal({
  visible,
  submitting,
  error,
  onClose,
  onSubmit,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Invitation['role']>('employé');
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  // Réinitialise le formulaire à chaque ouverture.
  useEffect(() => {
    if (visible) {
      setEmail('');
      setRole('employé');
      setRolePickerOpen(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Inviter un membre</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Adresse e-mail *</Text>
          <TextInput
            style={styles.input}
            placeholder="prenom.nom@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Rôle</Text>
          <TouchableOpacity
            style={styles.rolePicker}
            onPress={() => setRolePickerOpen(!rolePickerOpen)}
          >
            <Text style={styles.rolePickerText}>{getRoleLabel(role)}</Text>
            <ChevronDown size={18} color="#6B7280" />
          </TouchableOpacity>
          {rolePickerOpen && (
            <View style={styles.roleDropdown}>
              {INVITE_ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleOption,
                    role === r && styles.roleOptionActive,
                  ]}
                  onPress={() => {
                    setRole(r);
                    setRolePickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      role === r && styles.roleOptionTextActive,
                    ]}
                  >
                    {getRoleLabel(r)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!email.trim() || submitting) && styles.submitDisabled,
            ]}
            onPress={() => onSubmit(email, role)}
            disabled={!email.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Envoyer l'invitation</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
  },
  rolePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 4,
  },
  rolePickerText: { fontSize: 15, color: '#111827' },
  roleDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  roleOptionActive: { backgroundColor: '#EFF6FF' },
  roleOptionText: { fontSize: 15, color: '#374151' },
  roleOptionTextActive: { color: '#2563EB', fontWeight: '600' },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
