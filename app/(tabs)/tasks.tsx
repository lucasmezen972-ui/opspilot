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
import { TaskCompletionModal } from '../../features/tasks/TaskCompletionModal';
import { TaskFilters } from '../../features/tasks/TaskFilters';
import { TaskQuickStats } from '../../features/tasks/TaskQuickStats';
import {
  filterTasks,
  getTaskStats,
  getEmptyFilterText,
  type TaskFilter,
} from '../../features/tasks/taskModel';
import type { TaskCompletionInput } from '../../features/tasks/taskTraceability';
import { useAuth } from '../../hooks/useAuth';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../lib/supabase';
import { AppButton } from '../../shared/components/AppButton';
import { AppScreenHeader } from '../../shared/components/AppScreenHeader';
import { colors, shadow } from '../../shared/styles/tokens';
import { isManagerRole } from '../../utils/roles';

export default function TasksScreen() {
  const {
    tasks,
    loading,
    updateTaskStatus,
    completeTask,
    validateTask,
    createTask,
  } = useTasks();
  const { profile } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [completionTask, setCompletionTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const isManager = isManagerRole(profile?.role);

  const filteredTasks = useMemo(
    () => filterTasks(tasks, selectedFilter, profile?.id),
    [tasks, selectedFilter, profile?.id],
  );
  const stats = useMemo(() => getTaskStats(tasks), [tasks]);

  const handleStartTask = async (taskId: string) => {
    const result = await updateTaskStatus(taskId, 'in_progress');
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
    } else {
      Alert.alert(
        'Tâche démarrée',
        'La tâche est passée en cours de traitement.',
      );
    }
  };

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) setCompletionTask(task);
  };

  const handleConfirmCompletion = async (input: TaskCompletionInput) => {
    if (!completionTask) return;
    const result = await completeTask(completionTask.id, input);
    setCompletionTask(null);
    if (!result.error) {
      Alert.alert(
        'Tâche tracée',
        'Clôture enregistrée avec preuve d’exécution.',
      );
    }
  };

  const handleValidateTask = async (taskId: string) => {
    const result = await validateTask(
      taskId,
      profile?.full_name ?? 'Responsable',
    );
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
    } else {
      Alert.alert(
        'Tâche validée',
        'La réalisation a été contrôlée et validée.',
      );
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
      recurrence: draft.recurrence,
    });
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
    } else {
      Alert.alert('Tâche créée', 'La tâche a été ajoutée au planning.');
    }
  };

  return (
    <View style={styles.container}>
      <AppScreenHeader
        title="Tâches"
        titleTestID="page-tasks-title"
        subtitle="Exécution tracée & validée"
        right={
          <TouchableOpacity
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les filtres"
            onPress={() => setShowFilters((v) => !v)}
          >
            <Filter
              size={20}
              color={showFilters ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        }
      />

      <TaskQuickStats stats={stats} />

      {showFilters && (
        <TaskFilters selected={selectedFilter} onSelect={setSelectedFilter} />
      )}

      <AppButton
        label="Nouvelle tâche"
        icon={Plus}
        size="lg"
        onPress={() => setCreateModalVisible(true)}
        style={styles.createButton}
      />

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
            canValidate={isManager}
            onStart={handleStartTask}
            onComplete={handleCompleteTask}
            onValidate={handleValidateTask}
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

      <TaskCompletionModal
        visible={completionTask !== null}
        task={completionTask}
        defaultName={profile?.full_name ?? ''}
        onClose={() => setCompletionTask(null)}
        onConfirm={handleConfirmCompletion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    margin: 20,
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
