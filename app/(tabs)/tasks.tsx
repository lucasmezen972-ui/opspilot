import {
  Plus,
  Filter,
  Clock,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Calendar,
  MapPin,
  Flag,
  User,
  X,
} from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { useTasks } from '../../hooks/useTasks';

export default function TasksScreen() {
  const { tasks, loading, updateTaskStatus, createTask } = useTasks();
  const { profile } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'my' | 'pending' | 'in_progress'
  >('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<
    'low' | 'medium' | 'high' | 'urgent'
  >('medium');

  // Filtrer les tâches
  const filteredTasks = useMemo(() => {
    switch (selectedFilter) {
      case 'my':
        return tasks.filter((t) => t.assigned_to === profile?.id);
      case 'pending':
        return tasks.filter((t) => t.status === 'pending');
      case 'in_progress':
        return tasks.filter((t) => t.status === 'in_progress');
      default:
        return tasks;
    }
  }, [tasks, selectedFilter, profile?.id]);

  // Statistiques
  const pendingCount = useMemo(
    () => tasks.filter((t) => t.status === 'pending').length,
    [tasks],
  );
  const inProgressCount = useMemo(
    () => tasks.filter((t) => t.status === 'in_progress').length,
    [tasks],
  );
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks],
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#DC2626';
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Haute';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Basse';
      default:
        return 'Normale';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'pending':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'pending':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'in_progress':
        return 'En cours';
      case 'pending':
        return 'À faire';
      default:
        return 'Inconnu';
    }
  };

  const handleStartTask = async (taskId: string) => {
    const result = await updateTaskStatus(taskId, 'in_progress');
    if (!result.error) {
      Alert.alert(
        'Tâche démarrée',
        'Vous pouvez maintenant travailler sur cette tâche.',
      );
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const result = await updateTaskStatus(taskId, 'completed');
    if (!result.error) {
      Alert.alert('Félicitations !', 'Tâche terminée avec succès !');
    }
  };

  const handleCreateTask = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setCreateModalVisible(true);
  };

  const handleConfirmCreateTask = async () => {
    const title =
      newTaskTitle.trim() ||
      `Tâche du ${new Date().toLocaleDateString('fr-FR')}`;
    setCreateModalVisible(false);
    const result = await createTask({
      title,
      description: newTaskDescription.trim() || undefined,
      priority: newTaskPriority,
      location: 'Magasin principal',
    });
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
    } else {
      Alert.alert('Succès', 'Tâche créée avec succès !');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{pendingCount}</Text>
          <Text style={styles.quickStatLabel}>À faire</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{inProgressCount}</Text>
          <Text style={styles.quickStatLabel}>En cours</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{completedCount}</Text>
          <Text style={styles.quickStatLabel}>Terminées</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
        >
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'my', label: 'Mes tâches' },
            { key: 'pending', label: 'À faire' },
            { key: 'in_progress', label: 'En cours' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
              accessibilityRole="button"
              accessibilityLabel={`Filtrer par ${filter.label}`}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key &&
                    styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Create New Task Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateTask}
        accessibilityRole="button"
        accessibilityLabel="Créer une nouvelle tâche"
      >
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Nouvelle tâche</Text>
      </TouchableOpacity>

      {/* Tasks List */}
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
                {selectedFilter === 'all'
                  ? 'Aucune tâche disponible.'
                  : `Aucune tâche ${
                      selectedFilter === 'my'
                        ? 'qui vous est assignée'
                        : selectedFilter === 'pending'
                          ? 'en attente'
                          : 'en cours'
                    }.`}
              </Text>
            </View>
          )
        }
        renderItem={({ item: task }) => {
          const StatusIcon = getStatusIcon(task.status);
          return (
            <TouchableOpacity
              style={styles.taskCard}
              accessibilityRole="button"
              accessibilityLabel={`Voir les détails de la tâche ${task.title}`}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskTitleSection}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskMeta}>
                    <View
                      style={[
                        styles.priority,
                        {
                          backgroundColor: `${getPriorityColor(task.priority)}20`,
                        },
                      ]}
                    >
                      <Flag size={12} color={getPriorityColor(task.priority)} />
                      <Text
                        style={[
                          styles.priorityText,
                          { color: getPriorityColor(task.priority) },
                        ]}
                      >
                        {getPriorityText(task.priority)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.taskStatus,
                        { backgroundColor: `${getStatusColor(task.status)}20` },
                      ]}
                    >
                      <StatusIcon
                        size={12}
                        color={getStatusColor(task.status)}
                      />
                      <Text
                        style={[
                          styles.taskStatusText,
                          { color: getStatusColor(task.status) },
                        ]}
                      >
                        {getStatusText(task.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.taskDescription}>{task.description}</Text>

              <View style={styles.taskDetails}>
                <View style={styles.taskDetailRow}>
                  <User size={14} color="#6B7280" />
                  <Text style={styles.taskDetailText}>
                    {task.assigned_to === profile?.id
                      ? 'Vous'
                      : 'Autre utilisateur'}
                  </Text>
                </View>
                <View style={styles.taskDetailRow}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.taskDetailText}>{task.location}</Text>
                </View>
                <View style={styles.taskDetailRow}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.taskDetailText}>
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "Pas d'échéance"}
                  </Text>
                </View>
                <View style={styles.taskDetailRow}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.taskDetailText}>
                    {task.estimated_time_minutes
                      ? `${task.estimated_time_minutes} min`
                      : 'Non estimé'}
                  </Text>
                </View>
              </View>

              {task.status !== 'completed' && (
                <View style={styles.taskActions}>
                  {task.status === 'pending' ? (
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => handleStartTask(task.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Commencer la tâche"
                    >
                      <Text style={styles.startButtonText}>Commencer</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleCompleteTask(task.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Terminer la tâche"
                    >
                      <CheckCircle size={16} color="#FFFFFF" />
                      <Text style={styles.completeButtonText}>Terminer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateTask}
        accessibilityRole="button"
        accessibilityLabel="Créer une nouvelle tâche"
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle tâche</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="Titre de la tâche"
              autoFocus
            />
            <TextInput
              style={[
                styles.modalInput,
                { height: 80, textAlignVertical: 'top' },
              ]}
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              placeholder="Description (optionnel)"
              multiline
            />
            <View style={styles.prioritySelector}>
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    newTaskPriority === p && {
                      backgroundColor: getPriorityColor(p),
                      borderColor: getPriorityColor(p),
                    },
                  ]}
                  onPress={() => setNewTaskPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      newTaskPriority === p && { color: '#FFFFFF' },
                    ]}
                  >
                    {getPriorityText(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmCreateTask}
              >
                <Text style={styles.modalConfirmText}>Créer</Text>
              </TouchableOpacity>
            </View>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskTitleSection: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priority: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskStatusText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskDetails: {
    gap: 6,
    marginBottom: 12,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  startButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  startButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  modalConfirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});
