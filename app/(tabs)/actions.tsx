import { Plus, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { ActionCard } from '../../features/actions/ActionCard';
import { ActionsKanban } from '../../features/actions/ActionsKanban';
import { ActionsStatsRow } from '../../features/actions/ActionsStatsRow';
import {
  ActionsViewToggle,
  type ActionsViewMode,
} from '../../features/actions/ActionsViewToggle';
import {
  CreateActionModal,
  type NewActionPayload,
} from '../../features/actions/CreateActionModal';
import { STATUS_FLOW } from '../../features/actions/constants';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import type { CorrectiveAction } from '../../lib/supabase';
import { AppEmptyState } from '../../shared/components/AppEmptyState';

export default function ActionsScreen() {
  const {
    actions,
    loading,
    createAction,
    updateActionStatus,
    isOverdue,
    getActionsByStatus,
  } = useCorrectiveActions();

  const [viewMode, setViewMode] = useState<ActionsViewMode>('list');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const overdueCount = useMemo(
    () => actions.filter(isOverdue).length,
    [actions, isOverdue],
  );
  const openCount = getActionsByStatus('open').length;
  const inProgressCount = getActionsByStatus('in_progress').length;

  const handleCreate = async (payload: NewActionPayload) => {
    await createAction(payload);
    setCreateModalVisible(false);
  };

  const advanceStatus = (action: CorrectiveAction) => {
    const idx = STATUS_FLOW.indexOf(action.status);
    const next = idx >= 0 ? STATUS_FLOW[idx + 1] : undefined;
    if (next) {
      updateActionStatus(action.id, next);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title} testID="page-actions-title">
            Actions correctives
          </Text>
          <Text style={styles.subtitle}>
            Suivi des non-conformités et plans d'action
          </Text>
        </View>
        <TouchableOpacity
          testID="action-create-button"
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ActionsStatsRow
        open={openCount}
        inProgress={inProgressCount}
        overdue={overdueCount}
      />

      <ActionsViewToggle viewMode={viewMode} onChange={setViewMode} />

      {viewMode === 'list' ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {actions.length === 0 && !loading && (
            <AppEmptyState
              icon={CheckCircle}
              title="Aucune action corrective ouverte"
              description="Les non-conformités relevées en audit génèrent automatiquement un plan d'action correctif."
            />
          )}
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              overdue={isOverdue(action)}
              onAdvance={advanceStatus}
            />
          ))}
        </ScrollView>
      ) : (
        <ActionsKanban
          getActionsByStatus={getActionsByStatus}
          isOverdue={isOverdue}
          onAdvance={advanceStatus}
        />
      )}

      <CreateActionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
