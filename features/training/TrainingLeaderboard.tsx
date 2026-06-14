import { Crown, Trophy } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import type { LeaderboardEntry } from '../../hooks/useLeaderboard';
import { colors, radius, shadow } from '../../shared/styles/tokens';

interface TrainingLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#CD7F32'];

/** Section « Classement de l'équipe » : top des membres par XP. */
export function TrainingLeaderboard({
  entries,
  currentUserId,
}: TrainingLeaderboardProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Trophy size={18} color="#F59E0B" />
        <Text style={styles.sectionTitle}>Classement de l'équipe</Text>
      </View>
      <View style={styles.list}>
        {entries.map((entry, idx) => {
          const isMe = entry.id === currentUserId;
          const rankColor = RANK_COLORS[idx] ?? '#6B7280';
          return (
            <View key={entry.id} style={[styles.item, isMe && styles.itemMe]}>
              <View
                style={[
                  styles.rank,
                  { backgroundColor: idx < 3 ? `${rankColor}20` : '#F3F4F6' },
                ]}
              >
                {idx === 0 ? (
                  <Crown size={14} color={rankColor} />
                ) : (
                  <Text style={[styles.rankText, { color: rankColor }]}>
                    {idx + 1}
                  </Text>
                )}
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, isMe && styles.nameMe]}>
                  {entry.full_name ?? entry.email ?? 'Anonyme'}
                  {isMe ? ' (moi)' : ''}
                </Text>
                <Text style={styles.sub}>
                  Niv. {entry.level ?? 1} · {entry.completed_trainings ?? 0}{' '}
                  formations
                </Text>
              </View>
              <Text style={[styles.points, idx === 0 && styles.pointsTop]}>
                {entry.xp ?? 0} XP
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textStrong,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  itemMe: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderBottomWidth: 0,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    color: colors.textStrong,
    fontWeight: '500',
  },
  nameMe: {
    fontWeight: '700',
  },
  sub: {
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 2,
  },
  points: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
  },
  pointsTop: {
    color: '#F59E0B',
  },
});
