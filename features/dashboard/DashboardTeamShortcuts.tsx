import { router } from 'expo-router';
import { TrendingUp, Users } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing, shadow } from '../../shared/styles/tokens';

/** Section « Gestion équipe » : raccourcis managers/admins (équipe, multi-sites). */
export function DashboardTeamShortcuts() {
  return (
    <View style={styles.section}>
      <AppSectionHeader title="Gestion équipe" />
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/team')}
          accessibilityRole="link"
        >
          <Users size={22} color={colors.primary} />
          <Text style={styles.title}>Équipe</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/manager')}
          accessibilityRole="link"
        >
          <TrendingUp size={22} color={colors.primary} />
          <Text style={styles.title}>Multi-sites</Text>
        </TouchableOpacity>
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
    borderColor: colors.hairline,
    ...shadow.card,
  },
  title: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textStrong,
  },
});
