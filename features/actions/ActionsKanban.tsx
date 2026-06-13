import type { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { ActionCard } from './ActionCard';
import { STATUS_FLOW, STATUS_LABELS } from './constants';
import type { CorrectiveAction } from '../../lib/supabase';

interface ActionsKanbanProps {
  getActionsByStatus: (
    status: CorrectiveAction['status'],
  ) => CorrectiveAction[];
  isOverdue: (action: CorrectiveAction) => boolean;
  onAdvance: (action: CorrectiveAction) => void;
}

/** Tableau kanban des actions, une colonne par statut du flux. */
export function ActionsKanban({
  getActionsByStatus,
  isOverdue,
  onAdvance,
}: ActionsKanbanProps): ReactNode {
  return (
    <ScrollView
      horizontal
      style={styles.kanban}
      contentContainerStyle={styles.content}
    >
      {STATUS_FLOW.map((status) => {
        const columnActions = getActionsByStatus(status);
        return (
          <View key={status} style={styles.column}>
            <View style={styles.header}>
              <Text style={styles.title}>{STATUS_LABELS[status]}</Text>
              <View style={styles.count}>
                <Text style={styles.countText}>{columnActions.length}</Text>
              </View>
            </View>
            <ScrollView>
              {columnActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  overdue={isOverdue(action)}
                  compact
                  onAdvance={onAdvance}
                />
              ))}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kanban: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  column: {
    width: 270,
    marginHorizontal: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  count: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});
