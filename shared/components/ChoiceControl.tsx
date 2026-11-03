import {
  TouchableOpacity,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type ChoiceControlProps = Omit<
  TouchableOpacityProps,
  'onPress' | 'style' | 'accessibilityRole'
> & {
  accessibilityRole: 'checkbox' | 'radio';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Native touch/assistive-technology behavior stays with React Native. */
export function ChoiceControl(props: ChoiceControlProps) {
  return <TouchableOpacity {...props} />;
}
