import { router } from 'expo-router';
import {
  TrendingUp,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Target,
  ChartBar as BarChart3,
  Scan,
  BookOpen,
  Package,
  Calendar,
  Wrench,
  Users,
  CreditCard,
  Settings,
  FileText,
} from 'lucide-react-native';
import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import { useProducts } from '../../hooks/useProducts';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { audits } = useAudits();
  const { actions } = useCorrectiveActions();
  const { products } = useProducts();

  const now = new Date();

  /* ── KPIs ── */
  const auditsCompleted = useMemo(
    () => audits.filter((a) => a.status === 'completed').length,
    [audits],
  );

  const auditsOverdue = useMemo(
    () =>
      audits.filter(
        (a) =>
          (a.status === 'pending' || a.status === 'in_progress') &&
          a.due_date &&
          new Date(a.due_date) < now,
      ).length,
    [audits, now],
  );

  const actionsOpen = useMemo(
    () =>
      actions.filter((a) => a.status === 'open' || a.status === 'in_progress')
        .length,
    [actions],
  );

  const actionsCritical = useMemo(
    () =>
      actions.filter(
        (a) =>
          a.priority === 'critical' &&
          a.status !== 'done' &&
          a.status !== 'cancelled',
      ).length,
    [actions],
  );

  const dlcCritical = useMemo(() => {
    const in3Days = new Date(now.getTime() + 3 * 86_400_000);
    return products.filter(
      (p) => p.dlc && new Date(p.dlc) <= in3Days,
    ).length;
  }, [products, now]);

  const dlcAlerts = useMemo(() => {
    const in7Days = new Date(now.getTime() + 7 * 86_400_000);
    return products
      .filter((p) => p.dlc && new Date(p.dlc) <= in7Days)
      .sort((a, b) => new Date(a.dlc!).getTime() - new Date(b.dlc!).getTime())
      .slice(0, 5);
  }, [products, now]);

  const kpis = [
    {
      id: 'audits-done',
      label: 'Audits réalisés',
      value: auditsCompleted,
      color: '#10B981',
      bg: '#DCFCE7',
      icon: CheckCircle,
    },
    {
      id: 'audits-overdue',
      label: 'Audits en retard',
      value: auditsOverdue,
      color: auditsOverdue > 0 ? '#EF4444' : '#10B981',
      bg: auditsOverdue > 0 ? '#FEE2E2' : '#DCFCE7',
      icon: AlertTriangle,
    },
    {
      id: 'actions-open',
      label: 'Actions ouvertes',
      value: actionsOpen,
      color: actionsOpen > 0 ? '#F59E0B' : '#10B981',
      bg: actionsOpen > 0 ? '#FEF3C7' : '#DCFCE7',
      icon: Wrench,
    },
    {
      id: 'actions-critical',
      label: 'Actions critiques',
      value: actionsCritical,
      color: actionsCritical > 0 ? '#DC2626' : '#10B981',
      bg: actionsCritical > 0 ? '#FEE2E2' : '#DCFCE7',
      icon: AlertTriangle,
    },
    {
      id: 'dlc-critical',
      label: 'DLC critiques',
      value: dlcCritical,
      color: dlcCritical > 0 ? '#EF4444' : '#10B981',
      bg: dlcCritical > 0 ? '#FEE2E2' : '#DCFCE7',
      icon: Package,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
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

      {/* KPI Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KPIs du jour</Text>
        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <View
                key={kpi.label}
                testID={`kpi-${kpi.id}`}
                style={[styles.kpiCard, { borderLeftColor: kpi.color }]}
              >
                <View style={[styles.kpiIconWrap, { backgroundColor: kpi.bg }]}>
                  <Icon size={20} color={kpi.color} />
                </View>
                <Text
                  testID={`kpi-${kpi.id}-value`}
                  style={[styles.kpiValue, { color: kpi.color }]}
                >
                  {kpi.value}
                </Text>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* DLC Alerts */}
      {dlcAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertes DLC</Text>
            <TouchableOpacity onPress={() => router.push('/products')}>
              <Text style={styles.sectionLink}>Voir tout →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dlcCard}>
            {dlcAlerts.map((product, idx) => {
              const dlcDate = new Date(product.dlc!);
              const diffDays = Math.ceil(
                (dlcDate.getTime() - now.getTime()) / 86_400_000,
              );
              const isExpired = diffDays < 0;
              const isToday = diffDays === 0;
              const color = isExpired
                ? '#EF4444'
                : isToday
                  ? '#F59E0B'
                  : diffDays <= 2
                    ? '#F97316'
                    : '#6B7280';
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.dlcItem,
                    idx < dlcAlerts.length - 1 && styles.dlcItemBorder,
                  ]}
                  onPress={() => router.push('/products')}
                >
                  <View
                    style={[
                      styles.dlcIcon,
                      {
                        backgroundColor: isExpired
                          ? '#FEE2E2'
                          : isToday
                            ? '#FEF3C7'
                            : '#F3F4F6',
                      },
                    ]}
                  >
                    <Package size={14} color={color} />
                  </View>
                  <Text style={styles.dlcName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View
                    style={[
                      styles.dlcBadge,
                      {
                        backgroundColor: isExpired
                          ? '#FEE2E2'
                          : isToday
                            ? '#FEF3C7'
                            : '#FFF7ED',
                      },
                    ]}
                  >
                    <Calendar size={11} color={color} />
                    <Text style={[styles.dlcBadgeText, { color }]}>
                      {isExpired ? 'Expiré' : isToday ? "Aujourd'hui" : `J−${diffDays}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.quickGrid}>
          {[
            {
              icon: BarChart3,
              color: '#2563EB',
              title: 'Audits',
              sub: 'Créer / gérer',
              route: '/audits' as const,
            },
            {
              icon: Scan,
              color: '#059669',
              title: 'Produits',
              sub: 'Stock & DLC',
              route: '/products' as const,
            },
            {
              icon: Wrench,
              color: '#7C3AED',
              title: 'Actions correctives',
              sub: 'Suivi des actions',
              route: '/actions' as const,
            },
            {
              icon: Target,
              color: '#DC2626',
              title: 'Tâches',
              sub: 'Planning',
              route: '/tasks' as const,
            },
            {
              icon: FileText,
              color: '#0891B2',
              title: 'Rapports',
              sub: 'Exporter PDF',
              route: '/reports' as const,
            },
            {
              icon: BookOpen,
              color: '#D97706',
              title: 'Formation',
              sub: 'Classement & cours',
              route: '/training' as const,
            },
            {
              icon: CreditCard,
              color: '#7C3AED',
              title: 'Facturation',
              sub: 'Abonnement',
              route: '/billing' as const,
              roles: ['admin'],
            },
            {
              icon: Settings,
              color: '#6B7280',
              title: 'Paramètres',
              sub: 'Profil & équipe',
              route: '/profile' as const,
            },
          ]
            .filter(
              (item: any) =>
                !item.roles || item.roles.includes(profile?.role ?? ''),
            )
            .map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                style={styles.quickCard}
                onPress={() => router.push(item.route)}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: `${item.color}18` }]}>
                  <Icon size={26} color={item.color} />
                </View>
                <Text style={styles.quickTitle}>{item.title}</Text>
                <Text style={styles.quickSub}>{item.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Recent Audits */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Audits récents</Text>
          <TouchableOpacity onPress={() => router.push('/audits')}>
            <Text style={styles.sectionLink}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {audits.slice(0, 3).map((audit) => (
            <TouchableOpacity
              key={audit.id}
              style={styles.activityItem}
              onPress={() => router.push('/audits')}
            >
              <View
                style={[
                  styles.activityIcon,
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
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{audit.title}</Text>
                <Text style={styles.activityTime}>
                  {audit.status === 'completed' ? 'Terminé' : 'En cours'} ·{' '}
                  {new Date(audit.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              {audit.score != null && (
                <Text
                  style={[
                    styles.auditScore,
                    { color: audit.score >= 80 ? '#10B981' : audit.score >= 60 ? '#F59E0B' : '#EF4444' },
                  ]}
                >
                  {audit.score}%
                </Text>
              )}
            </TouchableOpacity>
          ))}

          {audits.length === 0 && (
            <TouchableOpacity
              style={styles.emptyState}
              onPress={() => router.push('/audits')}
            >
              <BarChart3 size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucun audit récent</Text>
              <Text style={styles.emptyLink}>Créer un audit →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Gamification */}
      {profile && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Votre progression</Text>
            <TouchableOpacity onPress={() => router.push('/training')}>
              <Text style={styles.sectionLink}>Classement →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gamificationPanel}>
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>Niv. {profile.level ?? 1}</Text>
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelName}>{profile.full_name}</Text>
                <Text style={styles.levelXP}>
                  {profile.xp ?? 0} XP · {profile.completed_trainings ?? 0} formations
                </Text>
              </View>
              <TouchableOpacity
                style={styles.profileBtn}
                onPress={() => router.push('/profile')}
              >
                <Text style={styles.profileBtnText}>Profil</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (profile.xp ?? 0) % 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.max(0, (profile.level ?? 1) * 100 - (profile.xp ?? 0))} XP
              jusqu'au niveau suivant
            </Text>
          </View>
        </View>
      )}

      {/* Team shortcuts for managers */}
      {(profile?.role === 'admin' || profile?.role === 'manager') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion équipe</Text>
          <View style={styles.mgmtRow}>
            <TouchableOpacity
              style={styles.mgmtCard}
              onPress={() => router.push('/team')}
            >
              <Users size={22} color="#2563EB" />
              <Text style={styles.mgmtTitle}>Équipe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mgmtCard}
              onPress={() => router.push('/manager')}
            >
              <TrendingUp size={22} color="#059669" />
              <Text style={styles.mgmtTitle}>Multi-sites</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLink: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '500',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  dlcCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  dlcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dlcItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dlcIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dlcName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  dlcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dlcBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  quickSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  activityTime: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  auditScore: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyLink: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  gamificationPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  levelBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  levelXP: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  profileBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  profileBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  mgmtRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mgmtCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  mgmtTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  bottomPadding: {
    height: 24,
  },
});
