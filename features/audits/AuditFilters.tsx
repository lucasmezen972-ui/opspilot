import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { AUDIT_STATUS_FILTERS } from './auditListModel';

interface AuditFiltersProps {
  statusFilter: string;
  onChange: (key: string) => void;
}

/** Onglets horizontaux de filtrage des audits par statut. */
export function AuditFilters({ statusFilter, onChange }: AuditFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {AUDIT_STATUS_FILTERS.map((f) => {
        const active = statusFilter === f.key;
        return (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(f.key)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 52,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  chipActive: {
    backgroundColor: '#2563EB',
  },
  chipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
