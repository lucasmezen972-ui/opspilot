import {
  Activity,
  Building2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Mail,
  Store,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import RequireRole from '../../components/RequireRole';
import {
  buildSuperadminAlerts,
  formatLastActivity,
  orgConfigStatus,
  orgStatusMeta,
  summarizeOrganizations,
  type ClientOrganization,
} from '../../features/backoffice/backofficeModel';
import { useAuth } from '../../hooks/useAuth';
import { useOrganizationPortfolio } from '../../hooks/useOrganizationPortfolio';
import { getDemoClientOrganizations } from '../../lib/demoData';
import { AppEmptyState } from '../../shared/components/AppEmptyState';
import { AppScreenHeader } from '../../shared/components/AppScreenHeader';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, shadow, spacing } from '../../shared/styles/tokens';
import { can } from '../../utils/permissions';

const SUPPORT_MAILTO =
  'mailto:contact@tradikom.com?subject=Back-office OpsPilot — pilotage multi-organisations';

type IconComponent = typeof Users;

export default function BackofficeScreen() {
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  if (isLocalDemo || can(profile?.role, 'backoffice.access')) {
    return <BackofficeContent isDemo={isLocalDemo} />;
  }

  return (
    <RequireRole roles={['admin']}>
      <BackofficeContent isDemo={false} />
    </RequireRole>
  );
}

function BackofficeContent({ isDemo }: { isDemo: boolean }) {
  const portfolio = useOrganizationPortfolio(!isDemo);
  const demoOrganizations = useMemo<ClientOrganization[]>(
    () => getDemoClientOrganizations(),
    [],
  );
  const organizations = isDemo ? demoOrganizations : portfolio.organizations;
  const summary = useMemo(
    () => summarizeOrganizations(organizations),
    [organizations],
  );
  const alerts = useMemo(
    () => buildSuperadminAlerts(organizations),
    [organizations],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = organizations.find((org) => org.id === selectedId) ?? null;

  const contactSupport = () => Linking.openURL(SUPPORT_MAILTO);

  return (
    <View style={styles.container}>
      <AppScreenHeader
        title="Back-office"
        titleTestID="page-backoffice-title"
        subtitle="Pilotage des organisations clientes"
        right={
          <TouchableOpacity
            testID="backoffice-support-button"
            style={styles.supportButton}
            onPress={contactSupport}
          >
            <Mail size={18} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {!isDemo && portfolio.status === 'loading' ? (
        <LoadingState />
      ) : organizations.length === 0 ? (
        <EmptyPortfolioState
          status={portfolio.status}
          onContactSupport={contactSupport}
        />
      ) : (
        <PortfolioList
          organizations={organizations}
          summary={summary}
          alerts={alerts}
          onSelect={setSelectedId}
        />
      )}

      <OrgDetailModal
        org={selected}
        onClose={() => setSelectedId(null)}
        onContactSupport={contactSupport}
      />
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.centeredText}>Chargement du portefeuille client…</Text>
    </View>
  );
}

function EmptyPortfolioState({
  status,
  onContactSupport,
}: {
  status: string;
  onContactSupport: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppEmptyState
        icon={Building2}
        title={emptyTitle(status)}
        description={emptyDescription(status)}
      />
      <TouchableOpacity
        testID="backoffice-activation-support"
        style={styles.primaryCta}
        onPress={onContactSupport}
      >
        <Mail size={18} color="#FFFFFF" />
        <Text style={styles.primaryCtaText}>Contacter le support</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PortfolioList({
  organizations,
  summary,
  alerts,
  onSelect,
}: {
  organizations: ClientOrganization[];
  summary: ReturnType<typeof summarizeOrganizations>;
  alerts: ReturnType<typeof buildSuperadminAlerts>;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.summaryRow}>
        <SummaryTile
          testID="backoffice-summary-orgs"
          value={summary.totalOrganizations}
          label="Organisations"
        />
        <SummaryTile
          testID="backoffice-summary-active"
          value={summary.activeCount}
          label="Actives"
          tint={colors.successText}
        />
        <SummaryTile
          testID="backoffice-summary-suspended"
          value={summary.suspendedCount}
          label="Suspendues"
          tint={colors.dangerStrong}
        />
        <SummaryTile
          testID="backoffice-summary-users"
          value={summary.totalUsers}
          label="Utilisateurs"
        />
      </View>

      {alerts.length > 0 && (
        <View style={styles.section}>
          <AppSectionHeader title="Alertes superadmin" />
          {alerts.map((alert) => (
            <View
              key={alert.id}
              testID={`backoffice-alert-${alert.id}`}
              style={[
                styles.alertCard,
                { borderLeftColor: severityColor(alert.severity) },
              ]}
            >
              <TriangleAlert
                size={16}
                color={severityColor(alert.severity)}
              />
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDetail}>{alert.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <AppSectionHeader title="Organisations clientes" />
        {organizations.map((org) => (
          <OrgCard key={org.id} org={org} onDetail={() => onSelect(org.id)} />
        ))}
      </View>
    </ScrollView>
  );
}

function emptyTitle(status: string): string {
  if (status === 'forbidden') return 'Accès back-office refusé';
  if (status === 'unavailable' || status === 'error') {
    return 'Back-office production à activer';
  }
  return 'Aucune organisation trouvée';
}

function emptyDescription(status: string): string {
  if (status === 'forbidden') {
    return 'Votre rôle ne permet pas de consulter le portefeuille client multi-organisations.';
  }
  if (status === 'unavailable' || status === 'error') {
    return (
      'La source de portefeuille client doit être déployée sur Supabase. ' +
      'Le mode démo reste complet, et notre équipe peut activer la prod.'
    );
  }
  return 'Le portefeuille client ne contient pas encore d’organisation exploitable.';
}

function SummaryTile({
  value,
  label,
  tint,
  testID,
}: {
  value: number;
  label: string;
  tint?: string;
  testID: string;
}) {
  return (
    <View style={styles.summaryTile} testID={testID}>
      <Text style={[styles.summaryValue, tint ? { color: tint } : null]}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function OrgCard({
  org,
  onDetail,
}: {
  org: ClientOrganization;
  onDetail: () => void;
}) {
  const status = orgStatusMeta(org.status);
  return (
    <View style={styles.orgCard} testID={`backoffice-org-${org.id}`}>
      <View style={styles.orgHeader}>
        <View style={styles.orgTitleBlock}>
          <Text style={styles.orgName}>{org.name}</Text>
          <Text style={styles.orgMeta}>
            {org.sector} · {planLabel(org.plan)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}> 
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.orgStats}>
        <OrgStat icon={Users} value={org.users} label="util." />
        <OrgStat icon={Store} value={org.stores} label="mag." />
        <OrgStat icon={ClipboardList} value={org.audits} label="audits" />
        <OrgStat
          icon={TriangleAlert}
          value={org.openActions}
          label="actions"
          tint={org.criticalActions > 0 ? colors.dangerStrong : undefined}
        />
        <OrgStat
          icon={GraduationCap}
          value={org.completedTrainings}
          label="form."
        />
      </View>

      <View style={styles.orgFooter}>
        <View style={styles.orgActivity}>
          <Activity size={13} color={colors.textMuted} />
          <Text style={styles.orgActivityText}>
            {formatLastActivity(org.lastActivityAt)}
          </Text>
        </View>
        <TouchableOpacity
          testID={`backoffice-org-detail-${org.id}`}
          style={styles.detailButton}
          onPress={onDetail}
        >
          <Text style={styles.detailButtonText}>Détail</Text>
          <ChevronRight size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OrgStat({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: IconComponent;
  value: number;
  label: string;
  tint?: string;
}) {
  return (
    <View style={styles.orgStat}>
      <Icon size={14} color={tint ?? colors.textMuted} />
      <Text style={[styles.orgStatValue, tint ? { color: tint } : null]}>
        {value}
      </Text>
      <Text style={styles.orgStatLabel}>{label}</Text>
    </View>
  );
}

function OrgDetailModal({
  org,
  onClose,
  onContactSupport,
}: {
  org: ClientOrganization | null;
  onClose: () => void;
  onContactSupport: () => void;
}) {
  if (!org) return null;
  const status = orgStatusMeta(org.status);
  const config = orgConfigStatus(org);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard} testID="backoffice-detail-modal">
          <View style={styles.modalHeader}>
            <View style={styles.titleBlock}>
              <Text style={styles.modalTitle}>{org.name}</Text>
              <Text style={styles.modalSubtitle}>
                {org.sector} · {planLabel(org.plan)}
              </Text>
            </View>
            <TouchableOpacity
              testID="backoffice-detail-close"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}> 
                {status.label}
              </Text>
            </View>

            <DetailSection title="Résumé opérationnel">
              <View style={styles.detailGrid}>
                <DetailKpi value={org.users} label="Utilisateurs" />
                <DetailKpi value={org.stores} label="Magasins" />
                <DetailKpi value={org.audits} label="Audits" />
                <DetailKpi value={org.openActions} label="Actions ouvertes" />
                <DetailKpi
                  value={org.criticalActions}
                  label="Dont critiques"
                  tint={
                    org.criticalActions > 0 ? colors.dangerStrong : undefined
                  }
                />
                <DetailKpi
                  value={org.completedTrainings}
                  label="Formations finies"
                />
              </View>
            </DetailSection>

            <DetailSection title="État de configuration">
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>{config.label}</Text>
                <Text style={styles.configScore}>{config.score}%</Text>
              </View>
              <View style={styles.configBarTrack}>
                <View
                  style={[styles.configBarFill, { width: `${config.score}%` }]}
                />
              </View>
            </DetailSection>

            <DetailSection title="Abonnement">
              <Text style={styles.lineText}>
                Plan {planLabel(org.plan)} · client depuis le{' '}
                {new Date(org.createdAt).toLocaleDateString('fr-FR')}
              </Text>
              <Text style={styles.lineText}>
                Dernière activité : {formatLastActivity(org.lastActivityAt)}
              </Text>
            </DetailSection>

            <DetailList
              title={`Magasins rattachés (${org.stores})`}
              icon={Store}
              items={org.storeList}
            />

            <DetailSection title="Utilisateurs / rôles">
              {org.roleBreakdown.map((role) => (
                <View key={role.role} style={styles.lineRow}>
                  <Users size={14} color={colors.textMuted} />
                  <Text style={styles.lineText}>
                    {capitalize(role.role)} · {role.count}
                  </Text>
                </View>
              ))}
            </DetailSection>

            <DetailSection title="Modules actifs">
              <View style={styles.chipsRow}>
                {org.activeModules.map((moduleId) => (
                  <View key={moduleId} style={styles.moduleChip}>
                    <Text style={styles.moduleChipText}>
                      {moduleLabel(moduleId)}
                    </Text>
                  </View>
                ))}
              </View>
            </DetailSection>

            <DetailSection title="Derniers audits">
              {org.recentAudits.map((audit) => (
                <View key={audit.title} style={styles.lineRow}>
                  <ClipboardList size={14} color={colors.textMuted} />
                  <Text style={styles.lineText}>
                    {audit.title}
                    {audit.score !== null ? ` · ${audit.score}%` : ' · en cours'}
                  </Text>
                </View>
              ))}
            </DetailSection>

            <DetailSection title="Dernières actions correctives">
              {org.recentActions.map((action) => (
                <View key={action.title} style={styles.lineRow}>
                  <TriangleAlert
                    size={14}
                    color={
                      action.priority === 'critical'
                        ? colors.dangerStrong
                        : colors.textMuted
                    }
                  />
                  <Text style={styles.lineText}>{action.title}</Text>
                </View>
              ))}
            </DetailSection>

            <TouchableOpacity
              testID="backoffice-detail-support"
              style={styles.primaryCta}
              onPress={onContactSupport}
            >
              <Mail size={18} color="#FFFFFF" />
              <Text style={styles.primaryCtaText}>Contacter le support</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: IconComponent;
  items: string[];
}) {
  return (
    <DetailSection title={title}>
      {items.map((name) => (
        <View key={name} style={styles.lineRow}>
          <Icon size={14} color={colors.textMuted} />
          <Text style={styles.lineText}>{name}</Text>
        </View>
      ))}
    </DetailSection>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailKpi({
  value,
  label,
  tint,
}: {
  value: number;
  label: string;
  tint?: string;
}) {
  return (
    <View style={styles.detailKpi}>
      <Text style={[styles.detailKpiValue, tint ? { color: tint } : null]}>
        {value}
      </Text>
      <Text style={styles.detailKpiLabel}>{label}</Text>
    </View>
  );
}

function severityColor(severity: 'critical' | 'high' | 'medium'): string {
  if (severity === 'critical') return colors.dangerStrong;
  if (severity === 'high') return colors.warning;
  return colors.warningText;
}

const PLAN_LABELS: Record<string, string> = {
  trial: 'Essai',
  essential: 'Essential',
  business: 'Business',
  enterprise: 'Enterprise',
};
function planLabel(plan: string): string {
  return PLAN_LABELS[plan] ?? capitalize(plan);
}

const MODULE_LABELS: Record<string, string> = {
  audits: 'Audits',
  actions: 'Actions',
  trainings: 'Formations',
  products: 'Produits / DLC',
  reports: 'Rapports',
  messaging: 'Messagerie',
};
function moduleLabel(id: string): string {
  return MODULE_LABELS[id] ?? capitalize(id);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centeredText: { fontSize: 13, color: colors.textMuted },
  supportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginTop: spacing.lg,
  },
  primaryCtaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadow.card,
  },
  summaryValue: { fontSize: 22, fontWeight: '800', color: colors.textStrong },
  summaryLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  section: { marginTop: spacing.xl },
  alertCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderLeftWidth: 3,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: colors.textStrong },
  alertDetail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  orgCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  orgTitleBlock: { flex: 1 },
  orgName: { fontSize: 16, fontWeight: '800', color: colors.textStrong },
  orgMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  orgStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  orgStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orgStatValue: { fontSize: 13, fontWeight: '700', color: colors.textStrong },
  orgStatLabel: { fontSize: 11, color: colors.textMuted },
  orgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: spacing.md,
  },
  orgActivity: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orgActivityText: { fontSize: 12, color: colors.textMuted },
  detailButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailButtonText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleBlock: { flex: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textStrong },
  modalSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  closeButton: { padding: 4 },
  modalBody: { padding: spacing.xl },
  detailSection: { marginTop: spacing.lg },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textStrong,
    marginBottom: spacing.sm,
  },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailKpi: {
    width: '31%',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  detailKpiValue: { fontSize: 18, fontWeight: '800', color: colors.textStrong },
  detailKpiLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configLabel: { fontSize: 13, fontWeight: '700', color: colors.textStrong },
  configScore: { fontSize: 13, fontWeight: '800', color: colors.primary },
  configBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.backgroundAlt,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  configBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 5,
  },
  lineText: { flex: 1, fontSize: 13, color: colors.text, paddingVertical: 3 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moduleChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  moduleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
