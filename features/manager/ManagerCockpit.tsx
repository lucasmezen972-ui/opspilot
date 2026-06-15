import {
  ShieldAlert,
  ClipboardList,
  Wrench,
  ListTodo,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import {
  type CockpitRisk,
  type CockpitSignals,
  cockpitHealth,
} from './cockpitModel';
import { AppKpiCard } from '../../shared/components/AppKpiCard';
import { AppRiskBadge } from '../../shared/components/AppRiskBadge';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import {
  colors,
  radius,
  spacing,
  shadow,
  typography,
  riskPalette,
} from '../../shared/styles/tokens';

type Props = {
  signals: CockpitSignals;
  risks: CockpitRisk[];
};

function scoreAccent(score: number): string {
  if (score >= 80) return colors.successText;
  if (score >= 70) return colors.warningText;
  if (score > 0) return colors.dangerStrong;
  return colors.textMuted;
}

export function ManagerCockpit({ signals, risks }: Props) {
  const health = cockpitHealth(signals.conformityScore);
  const accent = scoreAccent(signals.conformityScore);
  const healthChip = riskPalette[health.severity];

  return (
    <View testID="manager-cockpit" style={styles.wrap}>
      <View style={styles.hero}>
        <View style={styles.heroHead}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text style={styles.heroTitle}>Conformité globale</Text>
        </View>
        <Text
          testID="cockpit-conformity-score"
          style={[styles.heroScore, { color: accent }]}
        >
          {signals.conformityScore}%
        </Text>
        <View style={[styles.healthChip, { backgroundColor: healthChip.bg }]}>
          <Text style={[styles.healthChipText, { color: healthChip.fg }]}>
            {health.label}
          </Text>
        </View>
        <Text style={styles.heroHint}>
          {signals.scoredAuditCount > 0
            ? `Sur ${signals.scoredAuditCount} audit${signals.scoredAuditCount > 1 ? 's' : ''} clôturé${signals.scoredAuditCount > 1 ? 's' : ''}`
            : 'Aucun audit clôturé pour le moment'}
        </Text>
      </View>

      <View style={styles.kpiGrid}>
        <AppKpiCard
          testID="cockpit-kpi-overdue-audits"
          icon={ClipboardList}
          value={signals.overdueAudits}
          label="Audits en retard"
          accent={colors.warningText}
          accentSoft={colors.warningSoft}
        />
        <AppKpiCard
          testID="cockpit-kpi-critical-actions"
          icon={ShieldAlert}
          value={signals.criticalActions}
          label="Actions critiques"
          accent={colors.dangerStrong}
          accentSoft={colors.dangerSoft}
        />
        <AppKpiCard
          testID="cockpit-kpi-open-actions"
          icon={Wrench}
          value={signals.openActions}
          label="Plans d’action ouverts"
          accent={colors.primary}
          accentSoft={colors.primarySoft}
        />
        <AppKpiCard
          testID="cockpit-kpi-incomplete-tasks"
          icon={ListTodo}
          value={signals.incompleteTasks}
          label="Tâches non réalisées"
          accent={colors.warningText}
          accentSoft={colors.warningSoft}
        />
        <AppKpiCard
          testID="cockpit-kpi-training-gaps"
          icon={GraduationCap}
          value={signals.trainingGaps}
          label="Formations à valider"
          accent={colors.primary}
          accentSoft={colors.primarySoft}
        />
        <AppKpiCard
          testID="cockpit-kpi-unread-messages"
          icon={MessageSquare}
          value={signals.unreadMessages}
          label="Messages non lus"
          accent={colors.textMuted}
          accentSoft={colors.backgroundAlt}
        />
      </View>

      <AppSectionHeader title="Risques prioritaires" />
      {risks.length === 0 ? (
        <View style={styles.allClear} testID="cockpit-risks-empty">
          <ShieldCheck size={20} color={colors.successText} />
          <Text style={styles.allClearText}>
            Aucun risque prioritaire. Opérations sous contrôle.
          </Text>
        </View>
      ) : (
        <View style={styles.riskList}>
          {risks.map((risk) => {
            const sev = riskPalette[risk.severity];
            return (
              <View
                key={risk.id}
                testID={`cockpit-risk-${risk.id}`}
                style={styles.riskRow}
              >
                <View style={[styles.riskBar, { backgroundColor: sev.fg }]} />
                <View style={styles.riskBody}>
                  <View style={styles.riskTop}>
                    <Text style={styles.riskTitle}>{risk.title}</Text>
                    <AppRiskBadge level={risk.severity} />
                  </View>
                  <Text style={styles.riskDetail}>{risk.detail}</Text>
                </View>
                <Text style={[styles.riskCount, { color: sev.fg }]}>
                  {risk.count}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow.card,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroTitle: {
    ...typography.sectionTitle,
    color: colors.textStrong,
  },
  heroScore: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: spacing.sm,
  },
  healthChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginTop: spacing.xs,
  },
  healthChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroHint: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  riskList: {
    gap: spacing.sm,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  riskBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  riskBody: {
    flex: 1,
    padding: spacing.md,
    gap: 2,
  },
  riskTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  riskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textStrong,
  },
  riskDetail: {
    fontSize: 13,
    color: colors.textMuted,
  },
  riskCount: {
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: spacing.md,
  },
  allClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  allClearText: {
    flex: 1,
    fontSize: 14,
    color: colors.successText,
    fontWeight: '600',
  },
});
