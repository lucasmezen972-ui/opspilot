import { List, Columns3 as Columns } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type ActionsViewMode = 'list' | 'kanban';

interface ActionsViewToggleProps {
  viewMode: ActionsViewMode;
  onChange: (mode: ActionsViewMode) => void;
}

/** Bascule entre l'affichage liste et l'affichage kanban des actions. */
export function ActionsViewToggle({
  viewMode,
  onChange,
}: ActionsViewToggleProps) {
  return (
    <View style={styles.toggle}>
      <TouchableOpacity
        style={[styles.button, viewMode === 'list' && styles.buttonActive]}
        onPress={() => onChange('list')}
        testID="actions-view-list"
      >
        <List size={16} color={viewMode === 'list' ? '#2563EB' : '#6B7280'} />
        <Text style={[styles.text, viewMode === 'list' && styles.textActive]}>
          Liste
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, viewMode === 'kanban' && styles.buttonActive]}
        onPress={() => onChange('kanban')}
        testID="actions-view-kanban"
      >
        <Columns
          size={16}
          color={viewMode === 'kanban' ? '#2563EB' : '#6B7280'}
        />
        <Text style={[styles.text, viewMode === 'kanban' && styles.textActive]}>
          Kanban
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonActive: {
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  textActive: {
    color: '#2563EB',
  },
});
