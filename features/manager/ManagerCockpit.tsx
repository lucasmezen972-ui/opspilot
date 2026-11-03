import {
  ShieldAlert,
  ClipboardList,
  Wrench,
  ListTodo,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import {
  type CockpitRisk,
  type CockpitSignals,
  cockpitHealth,
} from './cockpitModel';
import { AppRiskBadge } from '../../shared/components/AppRiskBadge';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import {
  colors,
  radius,
  spacing,
  riskPalette,
} from '../../shared/styles/tokens';
import { DashboardGrid } from '../dashboard/DashboardGrid';

type Props = {
  signals: CockpitSignals;
  risks: CockpitRisk[];
};

export function ManagerCockpit({ signals, risks }: Props) {
  const health = cockpitHealth(signals.conformityScore);
  const healthChip = riskPalette[health.severity];

  return (
    <View testID="manager-cockpit" style={styles.wrap}>
      <View style={styles.overview}>
        <View style={styles.conformity}>
          <View style={styles.heroHead}>
            <ShieldCheck size={20} color={colors.primary} />
            <Text style={styles.heroTitle}>Conformité globale</Text>
            <View
              style={[styles.healthChip, { backgroundColor: healthChip.bg }]}
            >
              <Text style={[styles.healthChipText, { color: healthChip.fg }]}>
                {health.label}
              </Text>
            </View>
          </View>
          <View style={styles.heroResult}>
            <Text testID="cockpit-conformity-score" style={styles.heroScore}>
              {signals.conformityScore}%
            </Text>
            <Text style={styles.heroHint}>
              {signals.scoredAuditCount > 0
                ? `Sur ${signals.scoredAuditCount} audit${signals.scoredAuditCount > 1 ? 's' : ''} clôturé${signals.scoredAuditCount > 1 ? 's' : ''}`
                : 'Aucun audit clôturé pour le moment'}
            </Text>
          </View>
        </View>

        <View style={styles.signals}>
          <Text style={styles.signalsHeading}>Suivi opérationnel</Text>
          <DashboardGrid minItemWidth={134} columnOptions={[2, 3]}>
            <SignalMetric
              testID="cockpit-kpi-overdue-audits"
              icon={ClipboardList}
              value={signals.overdueAudits}
              label="Audits en retard"
              accent={colors.warningText}
            />
            <SignalMetric
              testID="cockpit-kpi-critical-actions"
              icon={ShieldAlert}
              value={signals.criticalActions}
              label="Actions critiques"
              accent={colors.dangerStrong}
            />
            <SignalMetric
              testID="cockpit-kpi-open-actions"
              icon={Wrench}
              value={signals.openActions}
              label="Plans d’action ouverts"
              accent={colors.primary}
            />
            <SignalMetric
              testID="cockpit-kpi-incomplete-tasks"
              icon={ListTodo}
              value={signals.incompleteTasks}
              label="Tâches non réalisées"
              accent={colors.warningText}
            />
            <SignalMetric
              testID="cockpit-kpi-training-gaps"
              icon={GraduationCap}
              value={signals.trainingGaps}
              label="Formations à valider"
              accent={colors.primary}
            />
            <SignalMetric
              testID="cockpit-kpi-unread-messages"
              icon={MessageSquare}
              value={signals.unreadMessages}
              label="Messages non lus"
              accent={colors.textMuted}
            />
          </DashboardGrid>
        </View>
      </View>

      <View style={styles.riskSection}>
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
            {risks.map((risk, index) => {
              const sev = riskPalette[risk.severity];
              return (
                <View
                  key={risk.id}
                  testID={`cockpit-risk-${risk.id}`}
                  style={[
                    styles.riskRow,
                    index === risks.length - 1 && styles.riskRowLast,
                  ]}
                >
                  <View style={styles.riskCountBlock}>
                    <Text style={[styles.riskCount, { color: sev.fg }]}>
                      {risk.count}
                    </Text>
                  </View>
                  <View style={styles.riskBody}>
                    <View style={styles.riskTop}>
                      <Text style={styles.riskTitle}>{risk.title}</Text>
                      <AppRiskBadge level={risk.severity} />
                    </View>
                    <Text style={styles.riskDetail}>{risk.detail}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function SignalMetric({
  icon: Icon,
  value,
  label,
  accent,
  testID,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  accent: string;
  testID: string;
}) {
  return (
    <View testID={testID} style={styles.metric}>
      <View style={styles.metricHead}>
        <Text style={styles.metricValue}>{value}</Text>
        <Icon size={17} color={accent} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xxl,
  },
  overview: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: spacing.lg,
  },
  conformity: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 240,
    minWidth: 0,
    justifyContent: 'center',
  },
  heroResult: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroTitle: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.primaryInk,
  },
  heroScore: {
    color: colors.primaryInk,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    letterSpacing: -2,
  },
  healthChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  healthChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroHint: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 120,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  signals: {
    flexGrow: 2,
    flexShrink: 1,
    flexBasis: 560,
    minWidth: 0,
  },
  signalsHeading: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  metric: {
    minHeight: 68,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  metricHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metricValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.primaryInk,
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  riskSection: { minWidth: 0 },
  riskList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  riskRowLast: { borderBottomWidth: 0 },
  riskCountBlock: { minWidth: 36, alignItems: 'center' },
  riskBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  riskTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  riskTitle: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 240,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.textStrong,
  },
  riskDetail: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  riskCount: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
  },
  allClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  allClearText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
  },
});
