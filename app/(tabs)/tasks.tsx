import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Filter, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Calendar, MapPin, Flag, User } from 'lucide-react-native';

const tasks = [
  {
    id: 1,
    title: 'Vérification des DLC rayon frais',
    description: 'Contrôler toutes les dates de péremption du rayon frais et retirer les produits expirés',
    priority: 'high',
    status: 'pending',
    assignee: 'Marie Dupont',
    location: 'Rayon frais',
    dueDate: '2024-01-15 14:00',
    estimatedTime: '30 min',
  },
  {
    id: 2,
    title: 'Réassort conserves',
    description: 'Compléter les rayons de conserves selon la liste fournie',
    priority: 'medium',
    status: 'in_progress',
    assignee: 'Pierre Martin',
    location: 'Allée 3',
    dueDate: '2024-01-15 16:00',
    estimatedTime: '45 min',
  },
  {
    id: 3,
    title: 'Nettoyage vitrine boucherie',
    description: 'Nettoyage complet de la vitrine et changement de l\'étiquetage',
    priority: 'low',
    status: 'completed',
    assignee: 'Jean Leroy',
    location: 'Boucherie',
    dueDate: '2024-01-15 11:00',
    estimatedTime: '20 min',
  },
];

export default function TasksScreen() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Normale';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in_progress': return 'En cours';
      case 'pending': return 'À faire';
      default: return 'Inconnu';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tâches</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>8</Text>
          <Text style={styles.quickStatLabel}>À faire</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>3</Text>
          <Text style={styles.quickStatLabel}>En cours</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>15</Text>
          <Text style={styles.quickStatLabel}>Terminées</Text>
        </View>
      </View>

      {/* Create New Task Button */}
      <TouchableOpacity style={styles.createButton}>
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Nouvelle tâche</Text>
      </TouchableOpacity>

      {/* Tasks List */}
      <ScrollView style={styles.tasksList}>
        {tasks.map((task) => {
          const StatusIcon = getStatusIcon(task.status);
          return (
            <TouchableOpacity key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskTitleSection}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskMeta}>
                    <View style={[styles.priority, { backgroundColor: `${getPriorityColor(task.priority)}20` }]}>
                      <Flag size={12} color={getPriorityColor(task.priority)} />
                      <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                        {getPriorityText(task.priority)}
                      </Text>
                    </View>
                    <View style={[styles.taskStatus, { backgroundColor: `${getStatusColor(task.status)}20` }]}>
                      <StatusIcon size={12} color={getStatusColor(task.status)} />
                      <Text style={[styles.taskStatusText, { color: getStatusColor(task.status) }]}>
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
                  <Text style={styles.taskDetailText}>{task.assignee}</Text>
                </View>
                <View style={styles.taskDetailRow}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.taskDetailText}>{task.location}</Text>
                </View>
                <View style={styles.taskDetailRow}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.taskDetailText}>{task.dueDate}</Text>
                </View>
                <View style={styles.taskDetailRow}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.taskDetailText}>{task.estimatedTime}</Text>
                </View>
              </View>

              {task.status !== 'completed' && (
                <View style={styles.taskActions}>
                  {task.status === 'pending' ? (
                    <TouchableOpacity style={styles.startButton}>
                      <Text style={styles.startButtonText}>Commencer</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.completeButton}>
                      <CheckCircle size={16} color="#FFFFFF" />
                      <Text style={styles.completeButtonText}>Terminer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    bottom: 90, // Ajuster pour éviter le chevauchement avec la barre d'onglets
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
});