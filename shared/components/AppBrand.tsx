import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { colors } from '../styles/tokens';

/** The open P combines an operation route and its completion point. */
export function AppBrandMark({
  size = 40,
  inverted = false,
}: {
  size?: number;
  inverted?: boolean;
}) {
  return (
    <View
      accessible={false}
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: size * 0.29 },
        inverted && styles.markInverted,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
        <Path
          d="M15 34V14H27a7 7 0 0 1 0 14h-6"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="33" cy="35" r="3" fill="#A7F3D0" />
      </Svg>
    </View>
  );
}

export function AppBrand({
  size = 40,
  wordmarkSize = 23,
  inverted = false,
  vertical = false,
  subtitle = 'Opérations terrain',
}: {
  size?: number;
  wordmarkSize?: number;
  inverted?: boolean;
  vertical?: boolean;
  subtitle?: string | false;
}) {
  return (
    <View style={[styles.brand, vertical && styles.vertical]}>
      <AppBrandMark size={size} inverted={inverted} />
      <View style={[styles.wordmark, vertical && styles.center]}>
        <Text
          accessibilityLabel="OpsPilot"
          style={[
            styles.name,
            { fontSize: wordmarkSize, lineHeight: wordmarkSize * 1.2 },
            inverted && styles.nameInverted,
            vertical && styles.centerText,
          ]}
        >
          Ops<Text aria-hidden>{'\u200B'}</Text>Pilot
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              inverted && styles.subtitleInverted,
              vertical && styles.centerText,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
    flexShrink: 1,
  },
  wordmark: { minWidth: 0, flexShrink: 1 },
  vertical: { flexDirection: 'column', gap: 14 },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  mark: { backgroundColor: colors.primary },
  markInverted: { backgroundColor: '#2C62E5' },
  name: { color: colors.textStrong, fontWeight: '700', letterSpacing: -0.9 },
  nameInverted: { color: '#FFFFFF' },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  subtitleInverted: { color: '#B8C5D8' },
});
