import type { ComponentProps, ComponentType, KeyboardEvent } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { AppPressable } from './AppPressable';
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
  id: string;
  label: string;
  panelID: string;
};

const KeyboardPressable = AppPressable as ComponentType<
  ComponentProps<typeof AppPressable> & {
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  }
>;

/** Barre d'onglets secondaire réutilisable (en-tête d'écran). */
export function AppTabBar<T extends string>({
  tabs,
  activeKey,
  onChange,
  id,
  label,
  panelID,
}: Props<T>) {
  return (
    <View
      style={styles.tabBar}
      accessibilityRole="tablist"
      accessibilityLabel={label}
    >
      {tabs.map((tab, index) => {
        const active = tab.key === activeKey;
        return (
          <KeyboardPressable
            key={tab.key}
            nativeID={`${id}-${tab.key}`}
            aria-controls={panelID}
            tabIndex={Platform.OS === 'web' ? (active ? 0 : -1) : undefined}
            onKeyDown={
              Platform.OS === 'web'
                ? (event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                      event.preventDefault();
                      if (!event.repeat) onChange(tab.key);
                      return;
                    }
                    const next =
                      event.key === 'ArrowRight'
                        ? (index + 1) % tabs.length
                        : event.key === 'ArrowLeft'
                          ? (index + tabs.length - 1) % tabs.length
                          : event.key === 'Home'
                            ? 0
                            : event.key === 'End'
                              ? tabs.length - 1
                              : null;
                    if (next !== null) {
                      event.preventDefault();
                      event.currentTarget.parentElement
                        ?.querySelectorAll<HTMLElement>('[role="tab"]')
                        [next]?.focus();
                    }
                  }
                : undefined
            }
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
          </KeyboardPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
