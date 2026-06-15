import { Check, ChevronLeft, PenLine } from 'lucide-react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '../../shared/styles/tokens';

export interface CandidateIdentityValues {
  fullName: string;
  employeeId: string;
  position: string;
  store: string;
  honorConfirmed: boolean;
}

interface Props {
  values: CandidateIdentityValues;
  errors: string[];
  onChange: <K extends keyof CandidateIdentityValues>(
    field: K,
    value: CandidateIdentityValues[K],
  ) => void;
  onBack: () => void;
  onSign: () => void;
}

function IdentityField({
  label,
  value,
  onChangeText,
  placeholder,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        testID={testID}
      />
    </View>
  );
}

/**
 * Étape d'identité du candidat avant délivrance d'une attestation
 * quasi-certifiante : nom, matricule, poste, magasin et confirmation sur
 * l'honneur, signés explicitement.
 */
export function CandidateIdentityStep({
  values,
  errors,
  onChange,
  onBack,
  onSign,
}: Props) {
  return (
    <>
      <ScrollView
        style={styles.body}
        testID="training-identity-form"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          Confirmez votre identité pour délivrer une attestation nominative et
          traçable.
        </Text>

        <IdentityField
          label="Nom complet"
          value={values.fullName}
          onChangeText={(text) => onChange('fullName', text)}
          placeholder="Prénom et nom"
          testID="training-identity-name"
        />
        <IdentityField
          label="Matricule"
          value={values.employeeId}
          onChangeText={(text) => onChange('employeeId', text)}
          placeholder="Ex. M-1042"
          testID="training-identity-matricule"
        />
        <IdentityField
          label="Poste"
          value={values.position}
          onChangeText={(text) => onChange('position', text)}
          placeholder="Ex. Responsable de rayon"
          testID="training-identity-position"
        />
        <IdentityField
          label="Magasin"
          value={values.store}
          onChangeText={(text) => onChange('store', text)}
          placeholder="Ex. Magasin Lyon Part-Dieu"
          testID="training-identity-store"
        />

        <TouchableOpacity
          style={styles.honorRow}
          testID="training-identity-honor"
          onPress={() => onChange('honorConfirmed', !values.honorConfirmed)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: values.honorConfirmed }}
        >
          <View
            style={[
              styles.checkbox,
              values.honorConfirmed && styles.checkboxChecked,
            ]}
          >
            {values.honorConfirmed && <Check size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.honorText}>
            Je certifie sur l'honneur être la personne nommée ci-dessus et avoir
            passé cette évaluation moi-même.
          </Text>
        </TouchableOpacity>

        {errors.length > 0 && (
          <View style={styles.errors} testID="training-identity-errors">
            {errors.map((error) => (
              <Text key={error} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <ChevronLeft size={18} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="training-certificate-sign"
          style={styles.primaryButton}
          onPress={onSign}
        >
          <PenLine size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Valider et signer</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  intro: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 18,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textStrong,
    backgroundColor: colors.surface,
  },
  honorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  honorText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  errors: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
