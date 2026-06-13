import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import type { TaskFilter } from './taskModel';
import { colors } from '../../shared/styles/tokens';

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'my', label: 'Mes tâches' },
  { key: 'pending', label: 'À faire' },
  { key: 'in_progress', label: 'En cours' },
];

interface TaskFiltersProps {
  selected: TaskFilter;
  onSelect: (filter: TaskFilter) => void;
}

/** Barre d'onglets de filtrage des tâches (toutes / mes tâches / statut). */
export function TaskFilters({ selected, onSelect }: TaskFiltersProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
      >
        {FILTERS.map((filter) => {
          const active = selected === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.button, active && styles.buttonActive]}
              onPress={() => onSelect(filter.key)}
              accessibilityRole="button"
              accessibilityLabel={`Filtrer par ${filter.label}`}
            >
              <Text style={[styles.text, active && styles.textActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  buttonActive: {
    backgroundColor: colors.primary,
  },
  text: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  textActive: {
    color: '#FFFFFF',
  },
});
