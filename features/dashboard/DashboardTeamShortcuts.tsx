import { TrendingUp, Users } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import {
  AppActionRow,
  AppActionIndicator,
} from '../../shared/components/AppActionRow';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing } from '../../shared/styles/tokens';

type Props = {
  compact?: boolean;
  embedded?: boolean;
};

/** Section « Gestion équipe » : raccourcis managers/admins (équipe, multi-sites). */
export function DashboardTeamShortcuts({
  compact = false,
  embedded = false,
}: Props) {
  return (
    <View style={!embedded && styles.section}>
      {compact ? (
        <Text style={styles.compactTitle} accessibilityRole="header">
          Gestion équipe
        </Text>
      ) : (
        <AppSectionHeader title="Gestion équipe" />
      )}
      <View style={[styles.row, compact && styles.compactRow]}>
        <AppActionRow
          style={[styles.card, compact && styles.compactCard]}
          href="/team"
          accessibilityRole="link"
        >
          <Users size={compact ? 17 : 22} color={colors.primary} />
          <Text style={styles.title}>Équipe</Text>
          {compact && <AppActionIndicator />}
        </AppActionRow>
        <AppActionRow
          style={[styles.card, compact && styles.compactCard]}
          href="/manager"
          accessibilityRole="link"
        >
          <TrendingUp size={compact ? 17 : 22} color={colors.primary} />
          <Text style={styles.title}>Multi-sites</Text>
          {compact && <AppActionIndicator />}
        </AppActionRow>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.xl,
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
  },
  card: {
    flex: 1,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.controlBorder,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  compactTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryInk,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  compactRow: {
    flexDirection: 'column',
    gap: 8,
  },
  compactCard: {
    flex: 0,
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
});
