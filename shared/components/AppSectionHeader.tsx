import { View, Text, StyleSheet } from 'react-native';

import { AppButton } from './AppButton';
import { colors, spacing } from '../styles/tokens';

interface AppSectionHeaderProps {
  title: string;
  /** Libellé du lien d'action à droite (ex. « Voir tout → »). */
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

/**
 * En-tête de section homogène : titre à gauche, lien d'action optionnel à
 * droite. Unifie le motif « Titre … Voir tout → » répété sur le tableau de
 * bord et les écrans de liste.
 */
export function AppSectionHeader({
  title,
  actionLabel,
  onAction,
  testID,
}: AppSectionHeaderProps) {
  const hasAction = Boolean(actionLabel && onAction);
  return (
    <View
      testID={testID}
      style={[styles.row, !hasAction && styles.rowNoAction]}
    >
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {hasAction && (
        <AppButton
          label={actionLabel!}
          onPress={onAction!}
          variant="secondary"
          size="sm"
          fullWidth={false}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  rowNoAction: {
    justifyContent: 'flex-start',
  },
  title: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textStrong,
  },
  action: {
    flexShrink: 0,
  },
});
