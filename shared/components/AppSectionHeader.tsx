import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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
      <Text style={styles.title}>{title}</Text>
      {hasAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.link}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rowNoAction: {
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textStrong,
  },
  link: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});
