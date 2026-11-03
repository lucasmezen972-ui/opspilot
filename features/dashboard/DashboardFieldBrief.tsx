import { router } from 'expo-router';
import {
  ArrowUpRight,
  ChevronDown,
  CircleCheck,
  TriangleAlert,
} from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { DashboardFieldBrief as FieldBrief } from './dashboardModel';
import { AppPressable } from '../../shared/components/AppPressable';
import { colors, radius, spacing } from '../../shared/styles/tokens';

interface DashboardFieldBriefProps {
  brief: FieldBrief;
  compact?: boolean;
  embedded?: boolean;
}

function toneColor(tone: FieldBrief['tone']) {
  if (tone === 'danger') return colors.dangerStrong;
  if (tone === 'warning') return colors.warningText;
  return colors.trustGreen;
}

export function DashboardFieldBrief({
  brief,
  compact = false,
  embedded = false,
}: DashboardFieldBriefProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(!compact);
  const accent = toneColor(brief.tone);
  const StatusIcon = brief.tone === 'success' ? CircleCheck : TriangleAlert;

  return (
    <View style={!embedded && styles.section}>
      <View style={styles.card} testID="dashboard-field-brief">
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Brief terrain du jour</Text>
            <View style={styles.statusLine}>
              <StatusIcon size={14} color={accent} />
              <Text style={[styles.status, { color: accent }]}>
                {brief.eyebrow}
              </Text>
            </View>
          </View>
          {compact && (
            <AppPressable
              onPress={() => setEvidenceOpen((open) => !open)}
              style={styles.evidenceToggle}
              hoverStyle={{ backgroundColor: colors.controlHover }}
              pressedStyle={{ backgroundColor: colors.controlPressed }}
              accessibilityRole="button"
              accessibilityLabel="Preuves et traçabilité"
              accessibilityState={{ expanded: evidenceOpen }}
              aria-expanded={evidenceOpen}
              aria-controls="dashboard-field-evidence"
            >
              <Text style={styles.evidenceToggleText}>Traçabilité</Text>
              <ChevronDown
                size={15}
                color={colors.textMuted}
                style={evidenceOpen ? styles.chevronOpen : undefined}
              />
            </AppPressable>
          )}
        </View>

        <View style={styles.mainRow}>
          <View style={styles.description}>
            <Text style={styles.priority}>{brief.title}</Text>
            <Text style={styles.message}>{brief.message}</Text>
          </View>
          <AppPressable
            style={styles.actionButton}
            hoverStyle={{ backgroundColor: colors.primaryDark }}
            pressedStyle={{ opacity: 0.82 }}
            onPress={() => router.push(brief.route)}
            testID="dashboard-field-brief-action"
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>{brief.actionLabel}</Text>
            <ArrowUpRight size={16} color={colors.surface} />
          </AppPressable>
        </View>

        {evidenceOpen && (
          <View
            style={styles.evidence}
            nativeID="dashboard-field-evidence"
            testID="dashboard-field-evidence"
          >
            <Text style={styles.proofText}>{brief.proof}</Text>
            <Text style={styles.trustText}>{brief.trustLine}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  status: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  evidenceToggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  evidenceToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  mainRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.lg,
  },
  description: {
    flexGrow: 1,
    flexBasis: 360,
    flexShrink: 1,
    minWidth: 0,
  },
  priority: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: colors.primaryInk,
  },
  message: {
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  actionButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
  evidence: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  proofText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
  trustText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
