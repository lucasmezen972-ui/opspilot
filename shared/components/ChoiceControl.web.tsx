import type { KeyboardEvent } from 'react';
import { Pressable } from 'react-native';

import type { ChoiceControlProps } from './ChoiceControl';

/** RN Web's press responder handles Enter but omits Space for radio/checkbox roles. */
export function ChoiceControl({
  disabled,
  onPress,
  style,
  ...props
}: ChoiceControlProps) {
  const keyboard = {
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        if (!disabled && !event.repeat && event.target === event.currentTarget)
          onPress();
      }
    },
  };
  return (
    <Pressable
      {...props}
      {...keyboard}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && !disabled && { opacity: 0.7 }]}
    />
  );
}
