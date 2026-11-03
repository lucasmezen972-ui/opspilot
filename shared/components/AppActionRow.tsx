import { Link, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppPressable } from './AppPressable';
import { colors, radius } from '../styles/tokens';

type Props = ComponentProps<typeof AppPressable> & { href?: Href };

/** Bounded navigation target; information-only rows never use this component. */
export function AppActionRow({
  style,
  accessibilityRole = 'link',
  href,
  ...props
}: Props) {
  const control = (
    <AppPressable
      {...props}
      accessibilityRole={accessibilityRole}
      style={StyleSheet.flatten([styles.row, style])}
      hoverStyle={styles.hover}
      pressedStyle={styles.pressed}
    />
  );
  return href ? (
    <Link href={href} asChild>
      {control}
    </Link>
  ) : (
    control
  );
}

/** Decorative cue belonging to its parent control, never a second button. */
export function AppActionIndicator() {
  return (
    <View style={styles.indicator} accessible={false} aria-hidden>
      <ChevronRight size={16} color={colors.surface} accessible={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  hover: {
    backgroundColor: colors.controlHover,
    borderColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.controlPressed,
    borderColor: colors.primaryDark,
  },
  indicator: {
    width: 26,
    height: 26,
    flexShrink: 0,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
