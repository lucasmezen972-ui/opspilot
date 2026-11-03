import { LockKeyhole, type LucideIcon } from 'lucide-react-native';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppPressable } from './AppPressable';
import { colors, radius, shadow } from '../styles/tokens';

type Variant = 'primary' | 'success' | 'secondary' | 'danger';
type Size = 'sm' | 'md' | 'lg';

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
  success: colors.trustGreen,
  secondary: colors.surface,
  danger: colors.dangerStrong,
};

const VARIANT_FG: Record<Variant, string> = {
  primary: '#FFFFFF',
  success: '#FFFFFF',
  secondary: colors.primaryDark,
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
  const isDisabled = disabled || loading;
  const fg = isDisabled ? colors.disabledText : VARIANT_FG[variant];
  const elevated = variant === 'primary' || variant === 'success';

  return (
    <AppPressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      aria-busy={loading}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : size === 'sm' ? styles.sm : styles.md,
        {
          backgroundColor: VARIANT_BG[variant],
          borderColor:
            variant === 'secondary'
              ? colors.controlBorder
              : VARIANT_BG[variant],
        },
        elevated && shadow.card,
        fullWidth && styles.fullWidth,
        style,
      ]}
      hoverStyle={{
        backgroundColor:
          variant === 'secondary'
            ? colors.controlHover
            : variant === 'primary'
              ? colors.primaryDark
              : VARIANT_BG[variant],
        borderColor:
          variant === 'secondary' ? colors.primary : VARIANT_BG[variant],
      }}
      pressedStyle={{ opacity: 0.82 }}
      disabledStyle={styles.disabled}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : disabled ? (
          <LockKeyhole size={16} color={fg} accessible={false} />
        ) : (
          Icon && <Icon size={size === 'lg' ? 22 : 18} color={fg} />
        )}
        <Text
          style={[
            styles.label,
            size === 'lg' ? styles.labelLg : null,
            size === 'sm' ? styles.labelSm : null,
            { color: fg },
          ]}
        >
          {label}
        </Text>
      </View>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  sm: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 1,
    backgroundColor: colors.disabledBackground,
    borderColor: colors.disabledBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelLg: {
    fontSize: 16,
  },
  labelSm: { fontSize: 13 },
});
