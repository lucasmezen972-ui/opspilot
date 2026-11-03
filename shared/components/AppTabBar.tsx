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
    <View style={styles.tabBar} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            testID={tab.testID}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            aria-selected={active}
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
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primaryDark,
  },
  tabTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
});
