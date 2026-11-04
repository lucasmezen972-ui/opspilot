import Constants from 'expo-constants';
import {
  ClipboardCheck,
  TriangleAlert as AlertTriangle,
  TrendingUp,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';

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
import { colors, spacing } from '../../shared/styles/tokens';

function auditStatusColor(status: string): string {
  if (status === 'completed') return colors.success;
  if (status === 'in_progress') return colors.warning;
  return colors.textMuted;
}

export default function ManagerDashboard() {
  return (
    <RequireRole roles={['manager', 'admin', 'superadmin']}>
      <ManagerDashboardContent />
    </RequireRole>
  );
}

function ManagerDashboardContent() {
  const { profile } = useAuth();
  const {
    audits,
    loading: auditsLoading,
    error: auditsError,
    refetch: refetchAudits,
  } = useAudits();
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useTasks();
  const { stores } = useStores();
  const { actions } = useCorrectiveActions();
  const { channels, getUnreadCount } = useChannels();
  const { entries: trainingEntries } = useTrainingSupervision();
  const { events: activityEvents } = useActivityLog();
  const [activeTab, setActiveTab] = useState<'cockpit' | 'details'>('cockpit');
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAudits(), refetchTasks()]);
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = auditsLoading || tasksLoading;
  const fetchError = auditsError ?? tasksError;

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerIntro}>
          <Text style={styles.eyebrow}>Pilotage multi-sites</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Cockpit Manager
          </Text>
        </View>
        <Text style={styles.subtitle}>
          Bienvenue, {profile?.full_name ?? 'Manager'}
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des données…</Text>
        </View>
      )}

      {fetchError && !isLoading && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      <AppTabBar
        id="manager-views"
        label="Vues du cockpit"
        panelID="manager-views-panel"
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'cockpit', label: 'Cockpit', testID: 'manager-tab-cockpit' },
          { key: 'details', label: 'Détails', testID: 'manager-tab-details' },
        ]}
      />

      <View
        nativeID="manager-views-panel"
        role="tabpanel"
        aria-labelledby={`manager-views-${activeTab}`}
        tabIndex={0}
        style={{ gap: 16 }}
      >
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
      </View>
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

      <View style={styles.detailsRow}>
        <View style={styles.detailsColumn}>
          <StatusBreakdown
            title="Statut des audits"
            entries={[
              {
                label: 'En attente',
                count: stats.pendingAudits,
                color: colors.textMuted,
              },
              {
                label: 'En cours',
                count: stats.inProgressAudits,
                color: colors.warning,
              },
              {
                label: 'Terminés',
                count: stats.completedAudits,
                color: colors.success,
              },
            ]}
          />
        </View>
        <View style={styles.detailsColumn}>
          <StatusBreakdown
            title="Statut des tâches"
            entries={[
              {
                label: 'À faire',
                count: stats.pendingTasks,
                color: colors.textMuted,
              },
              {
                label: 'En cours',
                count: stats.inProgressTasks,
                color: colors.warning,
              },
              {
                label: 'Terminées',
                count: stats.completedTasks,
                color: colors.success,
              },
            ]}
          />
        </View>
      </View>

      {(storeStats.length > 0 ||
        urgentTasks.length > 0 ||
        recentAudits.length > 0) && (
        <View style={styles.operationsRow}>
          {storeStats.length > 0 && (
            <View style={styles.operationsColumn}>
              <StorePerformanceList stores={storeStats} />
            </View>
          )}
          {(urgentTasks.length > 0 || recentAudits.length > 0) && (
            <View style={styles.operationsColumn}>
              {urgentTasks.length > 0 && (
                <ManagerActivityList
                  title="Tâches urgentes"
                  items={urgentTasks.map((task) => ({
                    id: task.id,
                    icon: <AlertTriangle size={16} color={colors.danger} />,
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
            </View>
          )}
        </View>
      )}

      {auditsEmpty && (
        <View style={styles.emptyState}>
          <TrendingUp size={48} color={colors.textFaint} />
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
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingBottom: spacing.xl,
  },
  header: {
    padding: spacing.xl,
    paddingTop:
      Platform.OS === 'web' ? 28 : (Constants.statusBarHeight ?? 44) + 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerIntro: { flexGrow: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
    fontWeight: '700',
    color: colors.primaryInk,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    paddingBottom: spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  detailsColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 320,
    minWidth: 0,
  },
  operationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    gap: spacing.xxl,
  },
  operationsColumn: { flexGrow: 1, flexShrink: 1, flexBasis: 400, minWidth: 0 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.dangerSoft,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    color: colors.dangerStrong,
    fontWeight: '500',
  },
});
