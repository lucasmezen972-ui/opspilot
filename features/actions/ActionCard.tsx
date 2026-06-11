import {
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Calendar,
  Flag,
  ChevronRight,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { PRIORITY_COLORS, PRIORITY_LABELS } from './constants';
import type { CorrectiveAction } from '../../lib/supabase';

interface ActionCardProps {
  action: CorrectiveAction;
  overdue: boolean;
  compact?: boolean;
  onAdvance: (action: CorrectiveAction) => void;
}

export function ActionCard({
  action,
  overdue,
  compact = false,
  onAdvance,
}: ActionCardProps) {
  return (
    <View
      testID={`action-card-${action.id}`}
      style={[styles.card, overdue && styles.cardOverdue]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: PRIORITY_COLORS[action.priority] + '22' },
          ]}
        >
          <Flag size={12} color={PRIORITY_COLORS[action.priority]} />
          <Text
            style={[
              styles.priorityText,
              { color: PRIORITY_COLORS[action.priority] },
            ]}
          >
            {PRIORITY_LABELS[action.priority]}
          </Text>
        </View>
        {overdue && (
          <View style={styles.overdueBadge}>
            <AlertTriangle size={12} color="#DC2626" />
            <Text style={styles.overdueText}>En retard</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={compact ? 2 : 3}>
        {action.title}
      </Text>
      {!compact && !!action.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {action.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        {!!action.due_date && (
          <View style={styles.dueDate}>
            <Calendar size={14} color={overdue ? '#DC2626' : '#6B7280'} />
            <Text style={[styles.dueDateText, overdue && { color: '#DC2626' }]}>
              {new Date(action.due_date).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
        {action.status !== 'done' && action.status !== 'cancelled' && (
          <TouchableOpacity
            style={styles.advanceButton}
            testID={`action-advance-${action.id}`}
            onPress={() => onAdvance(action)}
          >
            <Text style={styles.advanceButtonText}>
              {action.status === 'open' ? 'Démarrer' : 'Résoudre'}
            </Text>
            <ChevronRight size={14} color="#2563EB" />
          </TouchableOpacity>
        )}
        {action.status === 'done' && <CheckCircle size={18} color="#10B981" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardOverdue: {
    borderColor: '#FECACA',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  advanceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
});
