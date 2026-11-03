import Constants from 'expo-constants';
import { CalendarDays } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';

import { DashboardDlcAlerts } from '../../features/dashboard/DashboardDlcAlerts';
import { DashboardFieldBrief } from '../../features/dashboard/DashboardFieldBrief';
import { DashboardMetrics } from '../../features/dashboard/DashboardMetrics';
import { DashboardProgress } from '../../features/dashboard/DashboardProgress';
import { DashboardQuickActions } from '../../features/dashboard/DashboardQuickActions';
import { DashboardRecentAudits } from '../../features/dashboard/DashboardRecentAudits';
import { DashboardTeamShortcuts } from '../../features/dashboard/DashboardTeamShortcuts';
import { DashboardWorkspaceGrid } from '../../features/dashboard/DashboardWorkspaceGrid';
import {
  getDashboardFieldBrief,
  getDashboardKpis,
} from '../../features/dashboard/dashboardModel';
import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import { useProducts } from '../../hooks/useProducts';
import { AppErrorState } from '../../shared/components/AppErrorState';
import { AppLoadingState } from '../../shared/components/AppLoadingState';
import { colors, spacing } from '../../shared/styles/tokens';
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
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <AppLoadingState
            label="Actualisation des données terrain…"
            testID="home-data-loading"
          />
        ) : fetchError ? (
          <AppErrorState
            title="Données terrain indisponibles"
            message="Le brief et les compteurs attendent une lecture complète des audits, actions et produits. Réessayez pour retrouver votre situation à jour."
            onRetry={onRefresh}
            testID="home-data-error"
          />
        ) : (
          <>
            <DashboardFieldBrief brief={fieldBrief} compact embedded />
            <DashboardMetrics kpis={kpis} />
            <DashboardWorkspaceGrid
              first={
                <DashboardDlcAlerts products={products} now={now} embedded />
              }
              second={<DashboardRecentAudits audits={audits} embedded />}
              secondary={
                <>
                  {profile && (
                    <DashboardProgress profile={profile} compact embedded />
                  )}
                  <DashboardQuickActions
                    role={profile?.role ?? ''}
                    compact
                    embedded
                  />
                  {isManager && <DashboardTeamShortcuts compact embedded />}
                </>
              }
            />
          </>
        )}
        {(isLoading || !!fetchError) && (
          <DashboardQuickActions role={profile?.role ?? ''} compact embedded />
        )}
      </View>
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
    paddingBottom: 36,
  },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop:
      Platform.OS === 'web' ? 36 : (Constants.statusBarHeight ?? 44) + 16,
    paddingBottom: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  heroTitleBlock: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 0,
  },
  greeting: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: colors.primaryInk,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.xl,
    gap: 28,
  },
});
