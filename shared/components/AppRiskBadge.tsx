import { View, Text, StyleSheet } from 'react-native';

import { radius, riskPalette, type RiskLevel } from '../styles/tokens';

interface AppRiskBadgeProps {
  level: RiskLevel;
  /** Libellé personnalisé (sinon libellé par défaut du niveau). */
  label?: string;
  testID?: string;
}

/** Pastille de criticité tokenisée (critique / élevé / moyen / à suivre). */
export function AppRiskBadge({ level, label, testID }: AppRiskBadgeProps) {
  const tone = riskPalette[level];
  return (
    <View testID={testID} style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.label, { color: tone.fg }]}>
        {label ?? tone.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
