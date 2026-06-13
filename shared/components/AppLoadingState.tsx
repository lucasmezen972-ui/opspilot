import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { colors, spacing } from '../styles/tokens';

interface AppLoadingStateProps {
  label?: string;
  testID?: string;
}

/** Indicateur de chargement homogène (spinner + libellé optionnel). */
export function AppLoadingState({
  label = 'Chargement…',
  testID,
}: AppLoadingStateProps) {
  return (
    <View testID={testID} style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
