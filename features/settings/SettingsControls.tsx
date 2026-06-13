import { ExternalLink, Save } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  type KeyboardTypeOptions,
} from 'react-native';

/** Carte de réglages : en-tête (icône + titre + description) puis contenu. */
export function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>{icon}</View>
        <View style={styles.cardHeading}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

/** Champ de formulaire : libellé au-dessus d'un champ de saisie. */
export function SettingsField({
  label,
  value,
  onChangeText,
  placeholder,
  testID,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  testID: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        testID={testID}
      />
    </>
  );
}

/** Bouton d'action principal (icône d'enregistrement + libellé). */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Save size={17} color="#FFFFFF" />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Ligne de préférence : libellé + interrupteur. */
export function PreferenceRow({
  label,
  value,
  onValueChange,
  testID,
}: {
  label: string;
  value: boolean;
  onValueChange: () => void;
  testID: string;
}) {
  return (
    <View style={styles.preferenceRow}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
        thumbColor={value ? '#2563EB' : '#F8FAFC'}
        testID={testID}
      />
    </View>
  );
}

/** Lien vers un document légal ou une action externe. */
export function LegalLink({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={styles.legalLink}
      onPress={onPress}
      testID={testID}
    >
      <Text style={styles.legalLinkText}>{label}</Text>
      <ExternalLink size={16} color="#64748B" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
    padding: 20,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 18,
  },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  cardHeading: { flex: 1 },
  cardTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDescription: { color: '#64748B', fontSize: 13, lineHeight: 18 },
  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderRadius: 10,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    borderRadius: 9,
    flexDirection: 'row',
    marginTop: 2,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  buttonDisabled: { opacity: 0.55 },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  preferenceRow: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  preferenceLabel: { color: '#334155', flex: 1, fontSize: 15 },
  legalLink: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  legalLinkText: { color: '#1D4ED8', flex: 1, fontSize: 15 },
});
