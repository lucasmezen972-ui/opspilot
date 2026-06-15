import type { LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { colors, radius } from '../styles/tokens';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

const TONES: Record<BadgeTone, { fg: string; bg: string }> = {
  neutral: { fg: colors.textMuted, bg: colors.backgroundAlt },
  primary: { fg: colors.primary, bg: colors.primarySoft },
  success: { fg: colors.successText, bg: colors.successSoft },
  warning: { fg: colors.warningText, bg: colors.warningSoft },
  danger: { fg: colors.dangerStrong, bg: colors.dangerSoft },
};

interface AppBadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
  testID?: string;
}

/** Pastille générique tokenisée (libellé + tonalité, icône optionnelle). */
export function AppBadge({
  label,
  tone = 'neutral',
  icon: Icon,
  testID,
}: AppBadgeProps) {
  const { fg, bg } = TONES[tone];
  return (
    <View testID={testID} style={[styles.badge, { backgroundColor: bg }]}>
      {Icon && <Icon size={12} color={fg} />}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
