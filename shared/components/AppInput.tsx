import { useId, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type KeyboardTypeOptions,
} from 'react-native';

import { colors, radius, spacing } from '../styles/tokens';

interface AppInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  error?: string | null;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  testID?: string;
  required?: boolean;
  autoFocus?: boolean;
}

/** Champ de saisie premium tokenisé : label, focus, état d'erreur. */
export function AppInput({
  value,
  onChangeText,
  label,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  multiline,
  autoCapitalize,
  testID,
  required = false,
  autoFocus = false,
}: AppInputProps) {
  const [focused, setFocused] = useState(false);
  const fieldId = useId();
  return (
    <View style={styles.wrap}>
      {label && (
        <Text nativeID={`${fieldId}-label`} style={styles.label}>
          {label}
          {required ? ' *' : ''}
        </Text>
      )}
      <TextInput
        nativeID={fieldId}
        accessibilityLabel={label ?? placeholder}
        aria-labelledby={label ? `${fieldId}-label` : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        aria-invalid={Boolean(error)}
        aria-required={required}
        autoFocus={autoFocus}
        testID={testID}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error ? (
        <Text
          nativeID={`${fieldId}-error`}
          style={styles.error}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textStrong,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: 12,
    color: colors.dangerStrong,
  },
});
