import { Plus, Filter, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';

import {
  CreateTaskModal,
  type NewTaskDraft,
} from '../../features/tasks/CreateTaskModal';
import { TaskCard } from '../../features/tasks/TaskCard';
import { TaskFilters } from '../../features/tasks/TaskFilters';
import { TaskQuickStats } from '../../features/tasks/TaskQuickStats';
import {
  filterTasks,
  getTaskStats,
  getEmptyFilterText,
  type TaskFilter,
} from '../../features/tasks/taskModel';
import { useAuth } from '../../hooks/useAuth';
import { useTasks } from '../../hooks/useTasks';
import { colors, shadow } from '../../shared/styles/tokens';

export default function TasksScreen() {
  const { tasks, loading, updateTaskStatus, createTask } = useTasks();
  const { profile } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const filteredTasks = useMemo(
    () => filterTasks(tasks, selectedFilter, profile?.id),
    [tasks, selectedFilter, profile?.id],
  );
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);

  const handleStartTask = async (taskId: string) => {
    const result = await updateTaskStatus(taskId, 'in_progress');
    if (!result.error) {
      Alert.alert(
        'Tâche démarrée',
        'La tâche est passée en cours de traitement.',
      );
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const result = await updateTaskStatus(taskId, 'completed');
    if (!result.error) {
      Alert.alert('Tâche clôturée', 'La tâche a été marquée comme terminée.');
    }
  };

  const handleConfirmCreateTask = async (draft: NewTaskDraft) => {
    const title =
      draft.title.trim() ||
      `Tâche du ${new Date().toLocaleDateString('fr-FR')}`;
    setCreateModalVisible(false);
    const result = await createTask({
      title,
      description: draft.description.trim() || undefined,
      priority: draft.priority,
      location: 'Magasin principal',
    });
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
    } else {
      Alert.alert('Tâche créée', 'La tâche a été ajoutée au planning.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} testID="page-tasks-title">
          Tâches
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir les filtres"
        >
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <TaskQuickStats stats={stats} />

      <TaskFilters selected={selectedFilter} onSelect={setSelectedFilter} />

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setCreateModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Créer une nouvelle tâche"
      >
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Nouvelle tâche</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredTasks}
        keyExtractor={(task) => task.id}
        style={styles.tasksList}
        contentContainerStyle={styles.tasksListContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des tâches...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>Aucune tâche</Text>
              <Text style={styles.emptyStateText}>
                {getEmptyFilterText(selectedFilter)}
              </Text>
            </View>
          )
        }
        renderItem={({ item: task }) => (
          <TaskCard
            task={task}
            currentUserId={profile?.id}
            onStart={handleStartTask}
            onComplete={handleCompleteTask}
          />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Créer une nouvelle tâche"
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CreateTaskModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleConfirmCreateTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textStrong,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    ...shadow.card,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tasksList: {
    flex: 1,
  },
  tasksListContent: {
    padding: 20,
    paddingTop: 0,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.floating,
  },
});
