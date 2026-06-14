import { Bell, Download, Users } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  computeSupervisionStats,
  getTrainingStatusText,
  type MemberTrainingStatus,
} from './trainingModel';
import type { Training } from '../../lib/supabase';
import { colors } from '../../shared/styles/tokens';

interface Props {
  courses: Training[];
  entries: MemberTrainingStatus[];
  onSendReminder: (
    memberId: string,
    trainingId: string,
  ) => { memberName: string; trainingTitle: string };
}

function MemberInitials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials =
    parts.length >= 2
      ? `${parts[0]![0]}${parts[parts.length - 1]![0]}`
      : (parts[0]?.slice(0, 2) ?? '?');
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: MemberTrainingStatus['status'] }) {
  const colors_map: Record<string, string> = {
    completed: '#ECFDF5',
    in_progress: '#FEF3C7',
    not_started: '#F3F4F6',
  };
  const text_map: Record<string, string> = {
    completed: '#065F46',
    in_progress: '#92400E',
    not_started: '#6B7280',
  };
  return (
    <View style={[styles.statusBadge, { backgroundColor: colors_map[status] }]}>
      <Text style={[styles.statusBadgeText, { color: text_map[status] }]}>
        {getTrainingStatusText(status)}
      </Text>
    </View>
  );
}

function exportCSV(entries: MemberTrainingStatus[]) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const header = 'Nom,Rôle,Formation,Statut,Score,Date de validation\n';
  const rows = entries
    .map(
      (e) =>
        `"${e.memberName}","${e.memberRole}","${e.trainingTitle}","${getTrainingStatusText(e.status)}",${e.score ?? ''},${e.completedAt ?? ''}`,
    )
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `supervision-formations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function TrainingSupervision({
  courses,
  entries,
  onSendReminder,
}: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const filteredEntries = selectedCourseId
    ? entries.filter((e) => e.trainingId === selectedCourseId)
    : entries;

  const stats = computeSupervisionStats(filteredEntries);

  const uniqueMembers = [...new Set(entries.map((e) => e.memberId))];

  const memberRows: MemberTrainingStatus[][] = selectedCourseId
    ? filteredEntries.map((e) => [e])
    : uniqueMembers.map((memberId) =>
        entries.filter((e) => e.memberId === memberId),
      );

  const handleReminder = (memberId: string, trainingId: string) => {
    const { memberName, trainingTitle } = onSendReminder(memberId, trainingId);
    Alert.alert(
      'Relance envoyée',
      `Une notification a été envoyée à ${memberName} pour la formation "${trainingTitle}".`,
    );
  };

  return (
    <View style={styles.container} testID="training-supervision-container">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>Supervision formations</Text>
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => exportCSV(filteredEntries)}
          testID="training-supervision-export"
        >
          <Download size={14} color={colors.primary} />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View
          style={styles.statCard}
          testID="training-supervision-stat-completion"
        >
          <Text style={styles.statValue}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Taux de complétion</Text>
        </View>
        <View style={styles.statCard} testID="training-supervision-stat-score">
          <Text style={styles.statValue}>
            {stats.avgScore > 0 ? `${stats.avgScore}%` : '—'}
          </Text>
          <Text style={styles.statLabel}>Score moyen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {stats.inProgressCount}
          </Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View
          style={styles.statCard}
          testID="training-supervision-stat-certified"
        >
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {stats.completedCount}
          </Text>
          <Text style={styles.statLabel}>Terminés</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedCourseId === null && styles.filterChipActive,
          ]}
          onPress={() => setSelectedCourseId(null)}
          testID="training-supervision-filter-all"
        >
          <Text
            style={[
              styles.filterChipText,
              selectedCourseId === null && styles.filterChipTextActive,
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>
        {courses.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={[
              styles.filterChip,
              selectedCourseId === course.id && styles.filterChipActive,
            ]}
            onPress={() =>
              setSelectedCourseId(
                selectedCourseId === course.id ? null : course.id,
              )
            }
            testID={`training-supervision-filter-${course.id}`}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCourseId === course.id && styles.filterChipTextActive,
              ]}
              numberOfLines={1}
            >
              {course.category ?? course.title.slice(0, 18)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {selectedCourseId
          ? filteredEntries.map((entry) => (
              <View
                key={`${entry.memberId}-${entry.trainingId}`}
                style={styles.memberRow}
                testID={`training-supervision-member-${entry.memberId}`}
              >
                <MemberInitials name={entry.memberName} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{entry.memberName}</Text>
                  <Text style={styles.memberRole}>{entry.memberRole}</Text>
                </View>
                <View style={styles.memberRight}>
                  <StatusBadge status={entry.status} />
                  {entry.score !== null && (
                    <Text style={styles.scoreText}>{entry.score}%</Text>
                  )}
                </View>
                {entry.status !== 'completed' && (
                  <TouchableOpacity
                    style={styles.reminderButton}
                    onPress={() =>
                      handleReminder(entry.memberId, entry.trainingId)
                    }
                    testID={`training-supervision-reminder-${entry.memberId}-${entry.trainingId}`}
                  >
                    <Bell size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          : memberRows.map((memberEntries) => {
              const first = memberEntries[0];
              if (!first) return null;
              const completed = memberEntries.filter(
                (e) => e.status === 'completed',
              ).length;
              const total = memberEntries.length;
              const allDone = completed === total;
              return (
                <View
                  key={first.memberId}
                  style={styles.memberRow}
                  testID={`training-supervision-member-${first.memberId}`}
                >
                  <MemberInitials name={first.memberName} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{first.memberName}</Text>
                    <Text style={styles.memberRole}>{first.memberRole}</Text>
                  </View>
                  <View style={styles.memberRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: allDone ? '#ECFDF5' : '#F3F4F6',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: allDone ? '#065F46' : '#374151' },
                        ]}
                      >
                        {completed}/{total}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textStrong,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textStrong,
  },
  memberRole: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  reminderButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
