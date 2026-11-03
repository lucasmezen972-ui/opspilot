import { type LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import {
  AppActionRow,
  AppActionIndicator,
} from '../../shared/components/AppActionRow';
import { colors } from '../../shared/styles/tokens';

export interface ProfileMenuEntry {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

interface ProfileMenuProps {
  entries: ProfileMenuEntry[];
}

/** Menu « Paramètres » du profil : liste d'entrées navigables. */
export function ProfileMenu({ entries }: ProfileMenuProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Paramètres</Text>
      <View style={styles.menu}>
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <AppActionRow
              key={entry.label}
              style={styles.item}
              onPress={entry.onPress}
              accessibilityRole="button"
              accessibilityLabel={entry.label}
            >
              <Icon size={20} color={colors.primaryDark} />
              <Text style={styles.itemText}>{entry.label}</Text>
              <AppActionIndicator />
            </AppActionRow>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  menu: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemText: {
    fontSize: 16,
    color: colors.primaryDark,
    lineHeight: 22,
    flexShrink: 1,
    marginLeft: 12,
    flex: 1,
  },
});
