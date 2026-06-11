import {
  Plus,
  Clock,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  List,
  Columns3 as Columns,
  ChevronRight,
} from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { ActionCard } from '../../features/actions/ActionCard';
import { STATUS_FLOW, STATUS_LABELS } from '../../features/actions/constants';
import {
  CreateActionModal,
  type NewActionPayload,
} from '../../features/actions/CreateActionModal';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import type { CorrectiveAction } from '../../lib/supabase';

export default function ActionsScreen() {
  const {
    actions,
    loading,
    createAction,
    updateActionStatus,
    isOverdue,
    getActionsByStatus,
  } = useCorrectiveActions();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const overdueCount = useMemo(
    () => actions.filter(isOverdue).length,
    [actions, isOverdue],
  );
  const openCount = useMemo(
    () => getActionsByStatus('open').length,
    [getActionsByStatus],
  );
  const inProgressCount = useMemo(
    () => getActionsByStatus('in_progress').length,
    [getActionsByStatus],
  );

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

  const renderCard = (action: CorrectiveAction, compact = false) => (
    <ActionCard
      key={action.id}
      action={action}
      overdue={isOverdue(action)}
      compact={compact}
      onAdvance={advanceStatus}
    />
  );

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

      <View style={styles.statsRow} testID="actions-counters">
        <View style={styles.statCard}>
          <Clock size={18} color="#F59E0B" />
          <Text style={styles.statValue} testID="actions-count-open">
            {openCount}
          </Text>
          <Text style={styles.statLabel}>À traiter</Text>
        </View>
        <View style={styles.statCard}>
          <ChevronRight size={18} color="#2563EB" />
          <Text style={styles.statValue} testID="actions-count-inprogress">
            {inProgressCount}
          </Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={[styles.statCard, overdueCount > 0 && styles.statAlert]}>
          <AlertTriangle size={18} color="#DC2626" />
          <Text
            style={[styles.statValue, { color: '#DC2626' }]}
            testID="actions-count-overdue"
          >
            {overdueCount}
          </Text>
          <Text style={styles.statLabel}>En retard</Text>
        </View>
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'list' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('list')}
          testID="actions-view-list"
        >
          <List size={16} color={viewMode === 'list' ? '#2563EB' : '#6B7280'} />
          <Text
            style={[
              styles.toggleText,
              viewMode === 'list' && styles.toggleTextActive,
            ]}
          >
            Liste
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'kanban' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('kanban')}
          testID="actions-view-kanban"
        >
          <Columns
            size={16}
            color={viewMode === 'kanban' ? '#2563EB' : '#6B7280'}
          />
          <Text
            style={[
              styles.toggleText,
              viewMode === 'kanban' && styles.toggleTextActive,
            ]}
          >
            Kanban
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'list' ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {actions.length === 0 && !loading && (
            <View style={styles.empty}>
              <CheckCircle size={40} color="#10B981" />
              <Text style={styles.emptyText}>
                Aucune action corrective ouverte
              </Text>
            </View>
          )}
          {actions.map((a) => renderCard(a))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          style={styles.kanban}
          contentContainerStyle={styles.kanbanContent}
        >
          {STATUS_FLOW.map((status) => (
            <View key={status} style={styles.kanbanColumn}>
              <View style={styles.kanbanHeader}>
                <Text style={styles.kanbanTitle}>{STATUS_LABELS[status]}</Text>
                <View style={styles.kanbanCount}>
                  <Text style={styles.kanbanCountText}>
                    {getActionsByStatus(status).length}
                  </Text>
                </View>
              </View>
              <ScrollView>
                {getActionsByStatus(status).map((a) => renderCard(a, true))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statAlert: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#2563EB',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  kanban: {
    flex: 1,
  },
  kanbanContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  kanbanColumn: {
    width: 270,
    marginHorizontal: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
  },
  kanbanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  kanbanTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  kanbanCount: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  kanbanCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
