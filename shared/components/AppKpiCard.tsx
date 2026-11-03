import type { LucideIcon } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, shadow, typography } from '../styles/tokens';

interface AppKpiCardProps {
  /** Valeur affichée (déjà formatée). */
  value: string | number;
  /** Libellé sous la valeur. */
  label: string;
  /** Couleur d'accent (valeur, icône, liseré). */
  accent: string;
  /** Fond pastel de l'icône. */
  accentSoft: string;
  icon: LucideIcon;
  /** testID de la carte (ex. `kpi-audits-done`). */
  testID?: string;
  /** testID de la valeur (ex. `kpi-audits-done-value`). */
  valueTestID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Carte KPI premium du tableau de bord. Encapsule la mise en forme (liseré
 * d'accent, pastille d'icône, valeur, libellé) à partir des design tokens.
 */
export function AppKpiCard({
  value,
  label,
  accent,
  accentSoft,
  icon: Icon,
  testID,
  valueTestID,
  style,
}: AppKpiCardProps) {
  return (
    <View
      testID={testID}
      style={[styles.card, { borderLeftColor: accent }, style]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accentSoft }]}>
        <Icon size={20} color={accent} />
      </View>
      <Text testID={valueTestID} style={styles.value}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    minHeight: 144,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    color: colors.textStrong,
    fontSize: typography.kpiValue.fontSize,
    fontWeight: typography.kpiValue.fontWeight,
    marginBottom: 2,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
