import {
  ClipboardCheck,
  TriangleAlert as AlertTriangle,
  TrendingUp,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

import RequireRole from '../../components/RequireRole';
import { ActivityFeed } from '../../features/governance/ActivityFeed';
import { ManagerActivityList } from '../../features/manager/ManagerActivityList';
import { ManagerCockpit } from '../../features/manager/ManagerCockpit';
import { ManagerStatCards } from '../../features/manager/ManagerStatCards';
import { StatusBreakdown } from '../../features/manager/StatusBreakdown';
import { StorePerformanceList } from '../../features/manager/StorePerformanceList';
import {
  buildCockpitRisks,
  computeCockpitSignals,
} from '../../features/manager/cockpitModel';
import {
  computeManagerStats,
  computeStoreStats,
  getUrgentTasks,
} from '../../features/manager/managerModel';
import { computeSupervisionStats } from '../../features/training/trainingModel';
import { useActivityLog } from '../../hooks/useActivityLog';
import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import { useChannels } from '../../hooks/useChannels';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import { useStores } from '../../hooks/useStores';
import { useTasks } from '../../hooks/useTasks';
import { useTrainingSupervision } from '../../hooks/useTrainingSupervision';
import { AppTabBar } from '../../shared/components/AppTabBar';

function auditStatusColor(status: string): string {
  if (status === 'completed') return '#10B981';
  if (status === 'in_progress') return '#F59E0B';
  return '#6B7280';
}

export default function ManagerDashboard() {
  return (
    <RequireRole roles={['manager', 'admin']}>
      <ManagerDashboardContent />
    </RequireRole>
  );
}

function ManagerDashboardContent() {
  const { profile } = useAuth();
  const { audits } = useAudits();
  const { tasks } = useTasks();
  const { stores } = useStores();
  const { actions } = useCorrectiveActions();
  const { channels, getUnreadCount } = useChannels();
  const { entries: trainingEntries } = useTrainingSupervision();
  const { events: activityEvents } = useActivityLog();
  const [activeTab, setActiveTab] = useState<'cockpit' | 'details'>('cockpit');

  const stats = useMemo(
    () => computeManagerStats(audits, tasks),
    [audits, tasks],
  );
  const storeStats = useMemo(
    () => computeStoreStats(stores, audits),
    [stores, audits],
  );
  const recentAudits = useMemo(() => audits.slice(0, 5), [audits]);
  const urgentTasks = useMemo(() => getUrgentTasks(tasks), [tasks]);

  const unreadMessages = useMemo(
    () => channels.reduce((sum, c) => sum + getUnreadCount(c.id), 0),
    [channels, getUnreadCount],
  );
  const trainingGaps = useMemo(() => {
    const supervision = computeSupervisionStats(trainingEntries);
    return supervision.notStartedCount + supervision.inProgressCount;
  }, [trainingEntries]);
  const cockpitSignals = useMemo(
    () =>
      computeCockpitSignals({
        audits,
        actions,
        tasks,
        trainingGaps,
        unreadMessages,
      }),
    [audits, actions, tasks, trainingGaps, unreadMessages],
  );
  const cockpitRisks = useMemo(
    () => buildCockpitRisks(cockpitSignals),
    [cockpitSignals],
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cockpit Manager</Text>
        <Text style={styles.subtitle}>
          Bienvenue, {profile?.full_name ?? 'Manager'}
        </Text>
      </View>

      <AppTabBar
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'cockpit', label: 'Cockpit', testID: 'manager-tab-cockpit' },
          { key: 'details', label: 'Détails', testID: 'manager-tab-details' },
        ]}
      />

      {activeTab === 'cockpit' ? (
        <>
          <ManagerCockpit signals={cockpitSignals} risks={cockpitRisks} />
          <ActivityFeed events={activityEvents} />
        </>
      ) : (
        <ManagerDetails
          stats={stats}
          storeStats={storeStats}
          urgentTasks={urgentTasks}
          recentAudits={recentAudits}
          auditsEmpty={audits.length === 0 && tasks.length === 0}
        />
      )}
    </ScrollView>
  );
}

type DetailsProps = {
  stats: ReturnType<typeof computeManagerStats>;
  storeStats: ReturnType<typeof computeStoreStats>;
  urgentTasks: ReturnType<typeof getUrgentTasks>;
  recentAudits: ReturnType<typeof useAudits>['audits'];
  auditsEmpty: boolean;
};

function ManagerDetails({
  stats,
  storeStats,
  urgentTasks,
  recentAudits,
  auditsEmpty,
}: DetailsProps) {
  return (
    <>
      <ManagerStatCards stats={stats} />

      <StatusBreakdown
        title="Statut des audits"
        entries={[
          { label: 'En attente', count: stats.pendingAudits, color: '#6B7280' },
          {
            label: 'En cours',
            count: stats.inProgressAudits,
            color: '#F59E0B',
          },
          { label: 'Terminés', count: stats.completedAudits, color: '#10B981' },
        ]}
      />

      <StatusBreakdown
        title="Statut des tâches"
        entries={[
          { label: 'À faire', count: stats.pendingTasks, color: '#6B7280' },
          { label: 'En cours', count: stats.inProgressTasks, color: '#F59E0B' },
          {
            label: 'Terminées',
            count: stats.completedTasks,
            color: '#10B981',
          },
        ]}
      />

      {storeStats.length > 0 && <StorePerformanceList stores={storeStats} />}

      {urgentTasks.length > 0 && (
        <ManagerActivityList
          title="Tâches urgentes"
          items={urgentTasks.map((task) => ({
            id: task.id,
            icon: <AlertTriangle size={16} color="#EF4444" />,
            title: task.title,
            subtitle: `${task.location ?? 'Aucune localisation'} - ${
              task.status === 'in_progress' ? 'En cours' : 'À faire'
            }`,
          }))}
        />
      )}

      {recentAudits.length > 0 && (
        <ManagerActivityList
          title="Audits récents"
          last
          items={recentAudits.map((audit) => ({
            id: audit.id,
            icon: (
              <ClipboardCheck
                size={16}
                color={auditStatusColor(audit.status)}
              />
            ),
            title: audit.title,
            subtitle: `${audit.location ?? ''} ${
              audit.score != null ? `- Score: ${audit.score}%` : ''
            }`,
          }))}
        />
      )}

      {auditsEmpty && (
        <View style={styles.emptyState}>
          <TrendingUp size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Aucune donnée</Text>
          <Text style={styles.emptyText}>
            Les audits et tâches apparaîtront ici une fois créés.
          </Text>
        </View>
      )}
    </>
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
    letterSpacing: -0.4,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
