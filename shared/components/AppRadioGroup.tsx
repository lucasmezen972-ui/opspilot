import { Check } from 'lucide-react-native';
import type { ComponentProps, ComponentType, KeyboardEvent } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { AppPressable } from './AppPressable';
import { colors, radius } from '../styles/tokens';

const KeyboardPressable = AppPressable as ComponentType<
  ComponentProps<typeof AppPressable> & {
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  }
>;

type Choice<T extends string> = {
  key: T;
  label: string;
  testID?: string;
  selectedColor?: string;
};

/** A single choice, named and operable with touch, arrows, Space and Enter. */
export function AppRadioGroup<T extends string>({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={styles.choices}
      >
        {choices.map((choice, index) => {
          const active = value === choice.key;
          const color = choice.selectedColor ?? colors.primary;
          return (
            <KeyboardPressable
              key={choice.key}
              testID={choice.testID}
              accessibilityRole="radio"
              accessibilityLabel={choice.label}
              accessibilityState={{ checked: active }}
              aria-checked={active}
              tabIndex={Platform.OS === 'web' ? (active ? 0 : -1) : undefined}
              onPress={() => onChange(choice.key)}
              onKeyDown={
                Platform.OS === 'web'
                  ? (event) => {
                      if (event.key === ' ' || event.key === 'Enter') {
                        event.preventDefault();
                        if (!event.repeat) onChange(choice.key);
                        return;
                      }
                      const next =
                        event.key === 'ArrowRight' || event.key === 'ArrowDown'
                          ? (index + 1) % choices.length
                          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                            ? (index + choices.length - 1) % choices.length
                            : event.key === 'Home'
                              ? 0
                              : event.key === 'End'
                                ? choices.length - 1
                                : null;
                      if (next !== null) {
                        event.preventDefault();
                        onChange(choices[next]!.key);
                        event.currentTarget.parentElement
                          ?.querySelectorAll<HTMLElement>('[role="radio"]')
                          [next]?.focus();
                      }
                    }
                  : undefined
              }
              style={[
                styles.choice,
                active && { backgroundColor: color, borderColor: color },
              ]}
              hoverStyle={{ borderColor: colors.primaryDark }}
              pressedStyle={{ opacity: 0.85 }}
            >
              <View
                style={[styles.mark, active && styles.markSelected]}
                accessible={false}
                aria-hidden
              >
                {active && <Check size={13} color={color} accessible={false} />}
              </View>
              <Text style={[styles.text, active && styles.textSelected]}>
                {choice.label}
              </Text>
            </KeyboardPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    flexBasis: 110,
    flexGrow: 1,
    minHeight: 44,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.text,
  },
  textSelected: { color: colors.surface },
  mark: {
    width: 17,
    height: 17,
    borderWidth: 1,
    borderColor: colors.controlBorder,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  markSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
  },
});
