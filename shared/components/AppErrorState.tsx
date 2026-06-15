import { TriangleAlert } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../styles/tokens';

interface AppErrorStateProps {
  message: string;
  title?: string;
  /** Action de reprise (ex. réessayer). Le bouton n'apparaît que si fourni. */
  onRetry?: () => void;
  retryLabel?: string;
  testID?: string;
}

/** État d'erreur premium : icône, message contextualisé, reprise optionnelle. */
export function AppErrorState({
  message,
  title = 'Une erreur est survenue',
  onRetry,
  retryLabel = 'Réessayer',
  testID,
}: AppErrorStateProps) {
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.iconWrap}>
        <TriangleAlert size={28} color={colors.dangerStrong} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          testID={testID ? `${testID}-retry` : undefined}
          style={styles.retry}
          onPress={onRetry}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textStrong,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
});
