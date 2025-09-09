import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native'
import { X, Clock, User, MapPin, Flag, Calendar, CircleCheck as CheckCircle, Play } from 'lucide-react-native'
import { useTasks } from '../hooks/useTasks'

interface Task {
  id: string
  title: string
  description?: string
  priority: string
  status: string
  due_date?: string
  location?: string
  estimated_time_minutes?: number
  created_at: string
  updated_at: string
  completed_at?: string
}

interface TaskDetailModalProps {
  visible: boolean
  onClose: () => void
  task: Task | null
}

export default function TaskDetailModal({ visible, onClose, task }: TaskDetailModalProps) {
  const [updating, setUpdating] = useState(false)
  const { updateTaskStatus } = useTasks()

  if (!task) return null

  const handleStatusUpdate = async (newStatus: Task['status']) => {
    setUpdating(true)
    
    try {
      const result = await updateTaskStatus(task.id, newStatus)
      if (result.error) {
        console.error('Erreur mise à jour:', result.error)
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setUpdating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444'
      case 'high': return '#F59E0B'
      case 'medium': return '#3B82F6'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Haute'
      case 'medium': return 'Moyenne'
      case 'low': return 'Basse'
      default: return 'Normale'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981'
      case 'in_progress': return '#F59E0B'
      case 'pending': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée'
      case 'in_progress': return 'En cours'
      case 'pending': return 'À faire'
      default: return 'Inconnu'
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Détails de la tâche</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Titre et statut */}
            <View style={styles.titleSection}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(task.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                  {getStatusText(task.status)}
                </Text>
              </View>
            </View>

            {/* Description */}
            {task.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{task.description}</Text>
              </View>
            )}

            {/* Informations principales */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations</Text>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Flag size={16} color={getPriorityColor(task.priority)} />
                  <Text style={styles.infoLabel}>Priorité</Text>
                  <Text style={[styles.infoValue, { color: getPriorityColor(task.priority) }]}>
                    {getPriorityText(task.priority)}
                  </Text>
                </View>

                {task.location && (
                  <View style={styles.infoItem}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.infoLabel}>Lieu</Text>
                    <Text style={styles.infoValue}>{task.location}</Text>
                  </View>
                )}

                {task.estimated_time_minutes && (
                  <View style={styles.infoItem}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.infoLabel}>Durée estimée</Text>
                    <Text style={styles.infoValue}>{task.estimated_time_minutes} min</Text>
                  </View>
                )}

                {task.due_date && (
                  <View style={styles.infoItem}>
                    <Calendar size={16} color={isOverdue ? '#EF4444' : '#6B7280'} />
                    <Text style={styles.infoLabel}>Échéance</Text>
                    <Text style={[
                      styles.infoValue, 
                      isOverdue && styles.overdue
                    ]}>
                      {new Date(task.due_date).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {isOverdue && ' (En retard)'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Métadonnées */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Détails</Text>
              <View style={styles.metaInfo}>
                <Text style={styles.metaItem}>
                  Créée le {new Date(task.created_at).toLocaleDateString('fr-FR')}
                </Text>
                {task.completed_at && (
                  <Text style={styles.metaItem}>
                    Terminée le {new Date(task.completed_at).toLocaleString('fr-FR')}
                  </Text>
                )}
                <Text style={styles.metaItem}>
                  Dernière mise à jour: {new Date(task.updated_at).toLocaleString('fr-FR')}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          {task.status !== 'completed' && (
            <View style={styles.actions}>
              {task.status === 'pending' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() => handleStatusUpdate('in_progress')}
                  disabled={updating}
                >
                  <Play size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {updating ? 'Démarrage...' : 'Commencer'}
                  </Text>
                </TouchableOpacity>
              )}

              {task.status === 'in_progress' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => handleStatusUpdate('completed')}
                  disabled={updating}
                >
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {updating ? 'Finalisation...' : 'Marquer terminé'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  overdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  metaInfo: {
    gap: 6,
  },
  metaItem: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})