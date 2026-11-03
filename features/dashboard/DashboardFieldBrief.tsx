import { router } from 'expo-router';
import {
  Camera,
  CircleCheck,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { DashboardFieldBrief as FieldBrief } from './dashboardModel';
import { colors, radius, spacing } from '../../shared/styles/tokens';

interface DashboardFieldBriefProps {
  brief: FieldBrief;
}

function toneColor(tone: FieldBrief['tone']) {
  if (tone === 'danger') return colors.dangerStrong;
  if (tone === 'warning') return colors.warningText;
  return colors.trustGreen;
}

function toneBackground(tone: FieldBrief['tone']) {
  if (tone === 'danger') return colors.dangerSoft;
  if (tone === 'warning') return colors.warningSoft;
  return colors.successSoft;
}

function ToneIcon({ tone }: { tone: FieldBrief['tone'] }) {
  const color = toneColor(tone);
  if (tone === 'success') return <CircleCheck size={18} color={color} />;
  return <TriangleAlert size={18} color={color} />;
}

export function DashboardFieldBrief({ brief }: DashboardFieldBriefProps) {
  const accent = toneColor(brief.tone);

  return (
    <View style={styles.section}>
      <View
        style={[styles.card, { borderLeftColor: accent }]}
        testID="dashboard-field-brief"
      >
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: toneBackground(brief.tone) },
            ]}
          >
            <ToneIcon tone={brief.tone} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Brief terrain du jour</Text>
            <Text style={[styles.title, { color: accent }]}>
              {brief.eyebrow}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.description}>
            <Text style={styles.priority}>{brief.title}</Text>
            <Text style={styles.message}>{brief.message}</Text>
          </View>
          <View style={styles.proofBox}>
            <Camera size={17} color={colors.textMuted} />
            <Text style={styles.proofText}>{brief.proof}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.trustLine}>
            <ShieldCheck size={14} color={colors.trustGreen} />
            <Text style={styles.trustText}>{brief.trustLine}</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: accent }]}
            onPress={() => router.push(brief.route)}
            testID="dashboard-field-brief-action"
            accessibilityRole="button"
          >
            <Text style={[styles.actionText, { color: accent }]}>
              {brief.actionLabel}
            </Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    fontWeight: '500',
  },
  title: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  description: {
    flexGrow: 2,
    flexBasis: 280,
    minWidth: 0,
  },
  priority: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700',
    color: colors.textStrong,
  },
  message: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  proofBox: {
    flexGrow: 1,
    flexBasis: 260,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  proofText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  trustLine: {
    flexDirection: 'row',
    flexGrow: 1,
    flexBasis: 200,
    alignItems: 'center',
    gap: spacing.xs,
  },
  trustText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  actionButton: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
