import { type ReactNode, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../../shared/styles/tokens';

type Props = {
  first: ReactNode;
  second: ReactNode;
  secondary: ReactNode;
};

/** Le terrain occupe l'espace principal, les outils personnels restent au second plan. */
export function DashboardWorkspaceGrid({ first, second, secondary }: Props) {
  const [width, setWidth] = useState(0);
  const hasRail = width >= 1040;
  const primaryWidth = hasRail ? width - 284 - 28 : width;
  const hasPair = primaryWidth >= 660;

  return (
    <View
      style={[styles.workspace, hasRail && styles.workspaceWide]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <View
        style={[
          styles.primary,
          hasRail && styles.primaryWide,
          hasPair && styles.primaryPair,
        ]}
      >
        <View style={[styles.panel, hasPair && styles.pairedPanel]}>
          {first}
        </View>
        <View style={[styles.panel, hasPair && styles.pairedPanel]}>
          {second}
        </View>
      </View>
      <View style={[styles.secondary, hasRail && styles.rail]}>
        {secondary}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: {
    gap: 28,
    alignItems: 'stretch',
  },
  workspaceWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  primary: {
    minWidth: 0,
    gap: spacing.xl,
  },
  primaryWide: {
    flex: 1,
  },
  primaryPair: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  panel: {
    minWidth: 0,
  },
  pairedPanel: {
    flex: 1,
  },
  secondary: {
    minWidth: 0,
    gap: 28,
    padding: spacing.xl,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.xl,
  },
  rail: {
    width: 284,
  },
});
