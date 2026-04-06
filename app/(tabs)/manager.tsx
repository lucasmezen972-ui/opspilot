import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAudits } from '../../hooks/useAudits';
import { useTasks } from '../../hooks/useTasks';
import { useMemo } from 'react';
import {
  ChartBar as BarChart3,
  Users,
  ClipboardCheck,
  CircleCheck as CheckCircle,
  Clock,
  TriangleAlert as AlertTriangle,
  TrendingUp,
  Target,
} from 'lucide-react-native';

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const { audits } = useAudits();
  const { tasks } = useTasks();

  const stats = useMemo(() => {
    const pendingAudits = audits.filter((a) => a.status === 'pending').length;
    const inProgressAudits = audits.filter((a) => a.status === 'in_progress').length;
    const completedAudits = audits.filter((a) => a.status === 'completed').length;
    const avgScore = audits.filter((a) => a.score != null).length > 0
      ? Math.round(
          audits.filter((a) => a.score != null).reduce((sum, a) => sum + (a.score || 0), 0) /
          audits.filter((a) => a.score != null).length,
        )
      : 0;

    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

    return {
      pendingAudits,
      inProgressAudits,
      completedAudits,
      avgScore,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      highPriorityTasks,
      totalAudits: audits.length,
      totalTasks: tasks.length,
    };
  }, [audits, tasks]);

  const recentAudits = useMemo(() => audits.slice(0, 5), [audits]);
  const urgentTasks = useMemo(
    () => tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').slice(0, 5),
    [tasks],
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Manager</Text>
        <Text style={styles.subtitle}>Bienvenue, {profile?.full_name || 'Manager'}</Text>
      </View>

      {/* Vue d'ensemble */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <ClipboardCheck size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{stats.totalAudits}</Text>
            <Text style={styles.statLabel}>Audits total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
              <Target size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.avgScore}%</Text>
            <Text style={styles.statLabel}>Score moyen</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <BarChart3 size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.totalTasks}</Text>
            <Text style={styles.statLabel}>Tâches total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <AlertTriangle size={20} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{stats.highPriorityTasks}</Text>
            <Text style={styles.statLabel}>Urgentes</Text>
          </View>
        </View>
      </View>

      {/* Statut des audits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statut des audits</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#6B7280' }]} />
            <Text style={styles.statusLabel}>En attente</Text>
            <Text style={styles.statusCount}>{stats.pendingAudits}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.statusLabel}>En cours</Text>
            <Text style={styles.statusCount}>{stats.inProgressAudits}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusLabel}>Terminés</Text>
            <Text style={styles.statusCount}>{stats.completedAudits}</Text>
          </View>
        </View>
      </View>

      {/* Statut des tâches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statut des tâches</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#6B7280' }]} />
            <Text style={styles.statusLabel}>À faire</Text>
            <Text style={styles.statusCount}>{stats.pendingTasks}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.statusLabel}>En cours</Text>
            <Text style={styles.statusCount}>{stats.inProgressTasks}</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusLabel}>Terminées</Text>
            <Text style={styles.statusCount}>{stats.completedTasks}</Text>
          </View>
        </View>
      </View>

      {/* Tâches urgentes */}
      {urgentTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tâches urgentes</Text>
          {urgentTasks.map((task) => (
            <View key={task.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <AlertTriangle size={16} color="#EF4444" />
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{task.title}</Text>
                  <Text style={styles.listItemSubtitle}>
                    {task.location || 'Aucune localisation'} - {task.status === 'in_progress' ? 'En cours' : 'À faire'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Audits récents */}
      {recentAudits.length > 0 && (
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Audits récents</Text>
          {recentAudits.map((audit) => (
            <View key={audit.id} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <ClipboardCheck
                  size={16}
                  color={audit.status === 'completed' ? '#10B981' : audit.status === 'in_progress' ? '#F59E0B' : '#6B7280'}
                />
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{audit.title}</Text>
                  <Text style={styles.listItemSubtitle}>
                    {audit.location || ''} {audit.score != null ? `- Score: ${audit.score}%` : ''}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {audits.length === 0 && tasks.length === 0 && (
        <View style={styles.emptyState}>
          <TrendingUp size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Aucune donnée</Text>
          <Text style={styles.emptyText}>
            Les audits et tâches apparaîtront ici une fois créés.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
