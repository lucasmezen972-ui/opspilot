import type { LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { colors, spacing } from '../styles/tokens';

interface AppEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  testID?: string;
}

/** État vide premium et homogène (icône discrète, titre, explication). */
export function AppEmptyState({
  icon: Icon,
  title,
  description,
  testID,
}: AppEmptyStateProps) {
  return (
    <View testID={testID} style={styles.container}>
      <Icon size={48} color={colors.textFaint} />
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
