import type { LucideIcon } from 'lucide-react-native';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadow } from '../styles/tokens';

type Variant = 'primary' | 'success' | 'secondary' | 'danger';
type Size = 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_BG: Record<Variant, string> = {
  primary: colors.primary,
  success: colors.success,
  secondary: colors.primarySoft,
  danger: colors.danger,
};

const VARIANT_FG: Record<Variant, string> = {
  primary: '#FFFFFF',
  success: '#FFFFFF',
  secondary: colors.primary,
  danger: '#FFFFFF',
};

/**
 * Bouton d'action premium et unifié. Encapsule les variantes (primaire,
 * succès, secondaire, danger), tailles, icône, états chargement/désactivé
 * et l'élévation douce — à la place des `TouchableOpacity` ad hoc.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  fullWidth = true,
  testID,
  style,
}: AppButtonProps) {
  const fg = VARIANT_FG[variant];
  const isDisabled = disabled || loading;
  const elevated = variant === 'primary' || variant === 'success';

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: VARIANT_BG[variant] },
        elevated && shadow.card,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {Icon && <Icon size={size === 'lg' ? 22 : 18} color={fg} />}
          <Text
            style={[
              styles.label,
              size === 'lg' ? styles.labelLg : null,
              { color: fg },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelLg: {
    fontSize: 16,
  },
});
