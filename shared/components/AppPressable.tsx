import { forwardRef, useState } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type View as NativeView,
} from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disabledStyle?: StyleProp<ViewStyle>;
};

/** Keep touch, pointer and keyboard activation on the same semantic control. */
export const AppPressable = forwardRef<NativeView, Props>(function AppPressable(
  {
    style,
    hoverStyle,
    pressedStyle,
    disabledStyle,
    disabled,
    onHoverIn,
    onHoverOut,
    ...props
  }: Props,
  ref,
) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...props}
      ref={ref}
      disabled={disabled}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      style={({ pressed }) => [
        style,
        !disabled && hovered && hoverStyle,
        !disabled && pressed && pressedStyle,
        disabled && disabledStyle,
      ]}
    />
  );
});
