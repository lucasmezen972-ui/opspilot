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
import { isManagerRole } from '../../utils/roles';

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Bonjour, {profile?.full_name?.split(' ')[0] ?? 'Utilisateur'} !
          </Text>
          <Text style={styles.subtitle}>Tableau de bord opérationnel</Text>
        </View>
        <View style={styles.logo}>
          <Text style={styles.logoText}>OP</Text>
        </View>
      </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    padding: 20,
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
