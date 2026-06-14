import { type LucideIcon, ChevronRight } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { shadow } from '../../shared/styles/tokens';

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
            <TouchableOpacity
              key={entry.label}
              style={styles.item}
              onPress={entry.onPress}
            >
              <Icon size={20} color="#6B7280" />
              <Text style={styles.itemText}>{entry.label}</Text>
              <ChevronRight size={16} color="#D1D5DB" style={styles.chevron} />
            </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...shadow.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
});
