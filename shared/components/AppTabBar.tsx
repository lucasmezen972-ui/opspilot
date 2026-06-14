import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../styles/tokens';

export type AppTab<T extends string> = {
  key: T;
  label: string;
  testID?: string;
};

type Props<T extends string> = {
  tabs: AppTab<T>[];
  activeKey: T;
  onChange: (key: T) => void;
};

/** Barre d'onglets secondaire réutilisable (en-tête d'écran). */
export function AppTabBar<T extends string>({
  tabs,
  activeKey,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            testID={tab.testID}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
