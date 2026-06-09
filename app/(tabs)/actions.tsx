import {
  Plus,
  Clock,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Calendar,
  Flag,
  X,
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
  Modal,
  TextInput,
} from 'react-native';

import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import type { CorrectiveAction } from '../../lib/supabase';

const STATUS_FLOW: CorrectiveAction['status'][] = [
  'open',
  'in_progress',
  'done',
];

const STATUS_LABELS: Record<CorrectiveAction['status'], string> = {
  open: 'À traiter',
  in_progress: 'En cours',
  done: 'Résolues',
  cancelled: 'Annulées',
};

const PRIORITY_COLORS: Record<CorrectiveAction['priority'], string> = {
  critical: '#DC2626',
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

const PRIORITY_LABELS: Record<CorrectiveAction['priority'], string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

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
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] =
    useState<CorrectiveAction['priority']>('medium');
  const [newDueDays, setNewDueDays] = useState('7');

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

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const dueDays = parseInt(newDueDays, 10);
    await createAction({
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      priority: newPriority,
      due_date: Number.isFinite(dueDays)
        ? new Date(Date.now() + dueDays * 86400000).toISOString()
        : null,
    });
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDays('7');
    setCreateModalVisible(false);
  };

  const advanceStatus = (action: CorrectiveAction) => {
    const idx = STATUS_FLOW.indexOf(action.status);
    const next = idx >= 0 ? STATUS_FLOW[idx + 1] : undefined;
    if (next) {
      updateActionStatus(action.id, next);
    }
  };

  const renderCard = (action: CorrectiveAction, compact = false) => {
    const overdue = isOverdue(action);
    return (
      <View
        key={action.id}
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
              <Text
                style={[styles.dueDateText, overdue && { color: '#DC2626' }]}
              >
                {new Date(action.due_date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
          {action.status !== 'done' && action.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.advanceButton}
              onPress={() => advanceStatus(action)}
            >
              <Text style={styles.advanceButtonText}>
                {action.status === 'open' ? 'Démarrer' : 'Résoudre'}
              </Text>
              <ChevronRight size={14} color="#2563EB" />
            </TouchableOpacity>
          )}
          {action.status === 'done' && (
            <CheckCircle size={18} color="#10B981" />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Actions correctives</Text>
          <Text style={styles.subtitle}>
            Suivi des non-conformités et plans d'action
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Clock size={18} color="#F59E0B" />
          <Text style={styles.statValue}>{openCount}</Text>
          <Text style={styles.statLabel}>À traiter</Text>
        </View>
        <View style={styles.statCard}>
          <ChevronRight size={18} color="#2563EB" />
          <Text style={styles.statValue}>{inProgressCount}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={[styles.statCard, overdueCount > 0 && styles.statAlert]}>
          <AlertTriangle size={18} color="#DC2626" />
          <Text style={[styles.statValue, { color: '#DC2626' }]}>
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
        >
          <List
            size={16}
            color={viewMode === 'list' ? '#2563EB' : '#6B7280'}
          />
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
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
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
        <ScrollView horizontal style={styles.kanban} contentContainerStyle={styles.kanbanContent}>
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

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle action corrective</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Titre de l'action *"
              placeholderTextColor="#9CA3AF"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Description"
              placeholderTextColor="#9CA3AF"
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
            />

            <Text style={styles.fieldLabel}>Priorité</Text>
            <View style={styles.priorityRow}>
              {(
                ['low', 'medium', 'high', 'critical'] as const
              ).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    newPriority === p && {
                      backgroundColor: PRIORITY_COLORS[p] + '22',
                      borderColor: PRIORITY_COLORS[p],
                    },
                  ]}
                  onPress={() => setNewPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      newPriority === p && { color: PRIORITY_COLORS[p] },
                    ]}
                  >
                    {PRIORITY_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Échéance (jours)</Text>
            <TextInput
              style={styles.input}
              placeholder="7"
              placeholderTextColor="#9CA3AF"
              value={newDueDays}
              onChangeText={setNewDueDays}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                !newTitle.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!newTitle.trim()}
            >
              <Text style={styles.submitButtonText}>Créer l'action</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
