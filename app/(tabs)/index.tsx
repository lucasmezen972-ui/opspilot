import Constants from 'expo-constants';
import { CalendarDays } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';

import { DashboardDlcAlerts } from '../../features/dashboard/DashboardDlcAlerts';
import { DashboardFieldBrief } from '../../features/dashboard/DashboardFieldBrief';
import { DashboardGrid } from '../../features/dashboard/DashboardGrid';
import { DashboardProgress } from '../../features/dashboard/DashboardProgress';
import { DashboardQuickActions } from '../../features/dashboard/DashboardQuickActions';
import { DashboardRecentAudits } from '../../features/dashboard/DashboardRecentAudits';
import { DashboardTeamShortcuts } from '../../features/dashboard/DashboardTeamShortcuts';
import {
  getDashboardFieldBrief,
  getDashboardKpis,
} from '../../features/dashboard/dashboardModel';
import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import { useProducts } from '../../hooks/useProducts';
import { AppKpiCard } from '../../shared/components/AppKpiCard';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing } from '../../shared/styles/tokens';
import { isManagerRole } from '../../utils/roles';

export default function HomeScreen() {
  const { profile } = useAuth();
  const {
    audits,
    loading: auditsLoading,
    error: auditsError,
    refetch: refetchAudits,
  } = useAudits();
  const {
    actions,
    loading: actionsLoading,
    error: actionsError,
    refetch: refetchActions,
  } = useCorrectiveActions();
  const {
    products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAudits(), refetchActions(), refetchProducts()]);
    setRefreshing(false);
  }, [refetchAudits, refetchActions, refetchProducts]);

  const isLoading = auditsLoading || actionsLoading || productsLoading;
  const fetchError = auditsError ?? actionsError ?? productsError;

  const todayKey = new Date().toISOString().slice(0, 10);
  const now = useMemo(() => new Date(), [todayKey]);
  const kpis = useMemo(
    () => getDashboardKpis(audits, actions, products, now),
    [audits, actions, products, now],
  );
  const fieldBrief = useMemo(
    () => getDashboardFieldBrief(audits, actions, products, now),
    [audits, actions, products, now],
  );

  const isManager = isManagerRole(profile?.role);

  const kpiValue = (id: string) => kpis.find((k) => k.id === id)?.value ?? 0;
  const overdue = kpiValue('audits-overdue');
  const critical = kpiValue('actions-critical');
  const auditLabel =
    overdue > 1 ? 'contrôles à rattraper' : 'contrôle à rattraper';
  const actionLabel =
    critical > 1 ? 'actions à sécuriser' : 'action à sécuriser';
  const summary =
    overdue + critical > 0
      ? `${overdue} ${auditLabel} · ${critical} ${actionLabel}`
      : 'Terrain sous contrôle aujourd’hui';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.dateLine}>
          <CalendarDays size={15} color={colors.textMuted} />
          <Text style={styles.dateText}>
            {now.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
        <View style={styles.heroTop}>
          <View style={styles.heroTitleBlock}>
            <Text
              style={styles.greeting}
              testID="page-home-title"
              accessibilityRole="header"
            >
              Bonjour, {profile?.full_name?.split(' ')[0] ?? 'Utilisateur'} !
            </Text>
            <Text style={styles.subtitle}>
              Votre activité terrain, en un coup d’œil.
            </Text>
          </View>
        </View>
        <View style={styles.heroSummary}>
          <View style={styles.heroDot} />
          <Text style={styles.heroSummaryText}>{summary}</Text>
        </View>
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

      <DashboardFieldBrief brief={fieldBrief} />

      <View style={styles.section}>
        <AppSectionHeader title="Ce qui compte aujourd’hui" />
        <DashboardGrid columnOptions={[2, 3, 5]} minItemWidth={170}>
          {kpis.map((kpi) => (
            <AppKpiCard
              key={kpi.label}
              testID={`kpi-${kpi.id}`}
              valueTestID={`kpi-${kpi.id}-value`}
              value={kpi.value}
              label={kpi.label}
              accent={kpi.accent}
              accentSoft={kpi.accentSoft}
              icon={kpi.icon}
              style={styles.kpiCard}
            />
          ))}
        </DashboardGrid>
      </View>

      <DashboardDlcAlerts products={products} now={now} />

      <DashboardQuickActions role={profile?.role ?? ''} />

      <DashboardRecentAudits audits={audits} />

      {profile && <DashboardProgress profile={profile} />}

      {isManager && <DashboardTeamShortcuts />}

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop:
      Platform.OS === 'web' ? 28 : (Constants.statusBarHeight ?? 44) + 16,
    paddingBottom: spacing.xl,
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateText: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitleBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.textStrong,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  heroSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  heroSummaryText: {
    flexShrink: 1,
    color: colors.primaryInk,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    paddingTop: 18,
    paddingBottom: 0,
  },
  kpiCard: {
    width: '100%',
    minHeight: 144,
    flex: 1,
  },
  bottomPadding: {
    height: 24,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
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
