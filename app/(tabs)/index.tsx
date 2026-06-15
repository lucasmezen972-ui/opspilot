import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { DashboardDlcAlerts } from '../../features/dashboard/DashboardDlcAlerts';
import { DashboardProgress } from '../../features/dashboard/DashboardProgress';
import { DashboardQuickActions } from '../../features/dashboard/DashboardQuickActions';
import { DashboardRecentAudits } from '../../features/dashboard/DashboardRecentAudits';
import { DashboardTeamShortcuts } from '../../features/dashboard/DashboardTeamShortcuts';
import { getDashboardKpis } from '../../features/dashboard/dashboardModel';
import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import { useProducts } from '../../hooks/useProducts';
import { AppKpiCard } from '../../shared/components/AppKpiCard';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors } from '../../shared/styles/tokens';
import { isManagerRole } from '../../utils/roles';

const heroGradientColors = [colors.primary, colors.primaryDark] as const;

export default function HomeScreen() {
  const { profile } = useAuth();
  const { audits } = useAudits();
  const { actions } = useCorrectiveActions();
  const { products } = useProducts();

  const now = useMemo(() => new Date(), []);
  const kpis = useMemo(
    () => getDashboardKpis(audits, actions, products, now),
    [audits, actions, products, now],
  );

  const isManager = isManagerRole(profile?.role);

  const kpiValue = (id: string) => kpis.find((k) => k.id === id)?.value ?? 0;
  const overdue = kpiValue('audits-overdue');
  const critical = kpiValue('actions-critical');
  const auditLabel = overdue > 1 ? 'audits' : 'audit';
  const actionLabel = critical > 1 ? 'actions critiques' : 'action critique';
  const summary =
    overdue + critical > 0
      ? `${overdue} ${auditLabel} en retard · ${critical} ${actionLabel}`
      : 'Opérations sous contrôle aujourd’hui';

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={heroGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.greeting}>
              Bonjour, {profile?.full_name?.split(' ')[0] ?? 'Utilisateur'} !
            </Text>
            <Text style={styles.subtitle}>Tableau de bord opérationnel</Text>
          </View>
          <View style={styles.logo}>
            <Text style={styles.logoText}>OP</Text>
          </View>
        </View>
        <View style={styles.heroSummary}>
          <View style={styles.heroDot} />
          <Text style={styles.heroSummaryText}>{summary}</Text>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <AppSectionHeader title="KPIs du jour" />
        <View style={styles.kpiGrid}>
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
            />
          ))}
        </View>
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
    backgroundColor: '#F8FAFC',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 3,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  heroSummaryText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    paddingTop: 18,
    paddingBottom: 0,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bottomPadding: {
    height: 24,
  },
});
