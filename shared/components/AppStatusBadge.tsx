import type { LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { statusPalette, radius, type StatusLevel } from '../styles/tokens';

interface AppStatusBadgeProps {
  level: StatusLevel;
  label: string;
  icon?: LucideIcon;
  testID?: string;
}

/** Pastille de statut/criticité tokenisée (couleurs cohérentes partout). */
export function AppStatusBadge({
  level,
  label,
  icon: Icon,
  testID,
}: AppStatusBadgeProps) {
  const { fg, bg } = statusPalette[level];
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
    borderRadius: radius.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
