import { router } from 'expo-router';
import {
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  ChartBar as BarChart3,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { Audit } from '../../lib/supabase';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing, shadow } from '../../shared/styles/tokens';

interface DashboardRecentAuditsProps {
  audits: Audit[];
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

/** Section « Audits récents » : les trois derniers audits, ou un état vide. */
export function DashboardRecentAudits({ audits }: DashboardRecentAuditsProps) {
  return (
    <View style={styles.section}>
      <AppSectionHeader
        title="Audits récents"
        actionLabel="Voir tout →"
        onAction={() => router.push('/audits')}
      />
      <View style={styles.list}>
        {audits.slice(0, 3).map((audit) => (
          <TouchableOpacity
            key={audit.id}
            style={styles.item}
            onPress={() => router.push('/audits')}
          >
            <View
              style={[
                styles.icon,
                {
                  backgroundColor:
                    audit.status === 'completed' ? '#DCFCE7' : '#FEF3C7',
                },
              ]}
            >
              {audit.status === 'completed' ? (
                <CheckCircle size={16} color="#16A34A" />
              ) : (
                <AlertTriangle size={16} color="#D97706" />
              )}
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{audit.title}</Text>
              <Text style={styles.time}>
                {audit.status === 'completed' ? 'Terminé' : 'En cours'} ·{' '}
                {new Date(audit.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            {audit.score != null && (
              <Text style={[styles.score, { color: scoreColor(audit.score) }]}>
                {audit.score}%
              </Text>
            )}
          </TouchableOpacity>
        ))}

        {audits.length === 0 && (
          <TouchableOpacity
            style={styles.empty}
            onPress={() => router.push('/audits')}
          >
            <BarChart3 size={32} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun audit récent</Text>
            <Text style={styles.emptyLink}>Créer un audit →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.xl,
    paddingBottom: 0,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: spacing.sm + 2,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textStrong,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textFaint,
  },
  emptyLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});
