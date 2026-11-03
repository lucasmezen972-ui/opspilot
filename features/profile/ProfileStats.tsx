import { View, Text, StyleSheet } from 'react-native';

import type { ProfileStat } from './profileModel';
import { colors, shadow } from '../../shared/styles/tokens';
import { DashboardGrid } from '../dashboard/DashboardGrid';

interface ProfileStatsProps {
  stats: ProfileStat[];
}

/** Grille des statistiques de profil (audits, score, formations, temps). */
export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vos statistiques</Text>
      <DashboardGrid columnOptions={[2, 4]} minItemWidth={140}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <View key={stat.label} style={styles.card}>
              <View
                style={[styles.icon, { backgroundColor: `${stat.color}20` }]}
              >
                <Icon size={20} color={stat.color} />
              </View>
              <Text style={styles.value}>{stat.value}</Text>
              <Text style={styles.label}>{stat.label}</Text>
            </View>
          );
        })}
      </DashboardGrid>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
    width: '100%',
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
