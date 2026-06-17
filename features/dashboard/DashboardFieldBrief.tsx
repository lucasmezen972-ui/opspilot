import { router } from 'expo-router';
import {
  Camera,
  CircleCheck,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { DashboardFieldBrief as FieldBrief } from './dashboardModel';
import { colors, radius, shadow, spacing } from '../../shared/styles/tokens';

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
      <View style={styles.card} testID="dashboard-field-brief">
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
            <Text style={[styles.eyebrow, { color: accent }]}>
              Brief terrain du jour
            </Text>
            <Text style={styles.title}>{brief.eyebrow}</Text>
          </View>
        </View>

        <Text style={styles.priority}>{brief.title}</Text>
        <Text style={styles.message}>{brief.message}</Text>

        <View style={styles.proofBox}>
          <Camera size={16} color={colors.fieldAmber} />
          <Text style={styles.proofText}>{brief.proof}</Text>
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
    paddingTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.fieldWarm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    padding: spacing.lg,
    ...shadow.card,
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
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '800',
    color: colors.textStrong,
  },
  priority: {
    marginTop: spacing.md,
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryInk,
  },
  message: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  proofBox: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    padding: spacing.md,
  },
  proofText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.text,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
