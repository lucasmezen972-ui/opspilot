import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, spacing } from '../styles/tokens';

interface AppScreenHeaderProps {
  title: string;
  titleTestID?: string;
  subtitle?: string;
  /** Zone d'actions à droite (boutons, icônes). */
  right?: ReactNode;
}

/**
 * En-tête d'écran unifié (titre fort + sous-titre + actions). Garantit une
 * hiérarchie et un espacement cohérents sur tous les écrans (rendu premium).
 */
export function AppScreenHeader({
  title,
  titleTestID,
  subtitle,
  right,
}: AppScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title} testID={titleTestID} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
    fontWeight: '800',
    color: colors.textStrong,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
