import type { ReactNode } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

import { colors, radius, spacing, shadow } from '../styles/tokens';

interface AppCardProps {
  children: ReactNode;
  /** Style additionnel (marges, largeur…). */
  style?: StyleProp<ViewStyle>;
  /** Rend la carte interactive (élévation accentuée si sélectionnée). */
  onPress?: () => void;
  active?: boolean;
  testID?: string;
}

/** Conteneur de surface premium (carte) tokenisé : bordure, rayon, ombre. */
export function AppCard({
  children,
  style,
  onPress,
  active = false,
  testID,
}: AppCardProps) {
  const cardStyle = [
    styles.card,
    active ? shadow.cardActive : shadow.card,
    active && styles.cardActive,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardActive: {
    borderColor: colors.primary,
  },
});
