import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Alert } from 'react-native'
import { X, Plus, Clock, MapPin, Flag } from 'lucide-react-native'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'

interface TaskModalProps {
  visible: boolean
  onClose: () => void
}

export default function TaskModal({ visible, onClose }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { createTask } = useTasks()
  const { profile } = useAuth()

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🆕 Création tâche:', title)
      
      const result = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        assigned_to: profile?.id,
        priority,
        due_date: dueDate || undefined
      })

      if (result.error) {
        setError('Erreur lors de la création de la tâche')
        console.error(result.error)
        Alert.alert('Erreur', 'Impossible de créer la tâche')
      } else {
        console.log('✅ Tâche créée avec succès')
        Alert.alert('Succès', 'Tâche créée avec succès !', [
          { text: 'OK', onPress: handleClose }
        ])
      }
    } catch (error) {
      setError('Erreur inattendue')
      console.error(error)
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setLocation('')
    setPriority('medium')
    setDueDate('')
    setError('')
    onClose()
  }

  const setQuickDueDate = (hours: number) => {
    const dueDate = new Date()
    dueDate.setHours(dueDate.getHours() + hours)
    setDueDate(dueDate.toISOString())
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Créer une tâche</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Titre de la tâche *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Vérifier les DLC du rayon frais"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Détails de la tâche..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lieu</Text>
              <View style={styles.inputWithIcon}>
                <MapPin size={20} color="#6B7280" />
                <TextInput
                  style={styles.inputWithIconText}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Ex: Rayon frais, Zone de réception..."
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priorité</Text>
              <View style={styles.prioritySelector}>
                {[
                  { value: 'low', label: 'Basse', color: '#10B981' },
                  { value: 'medium', label: 'Moyenne', color: '#F59E0B' },
                  { value: 'high', label: 'Haute', color: '#EF4444' }
                ].map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.priorityOption,
                      priority === p.value && { backgroundColor: `${p.color}20`, borderColor: p.color }
                    ]}
                    onPress={() => setPriority(p.value)}
                  >
                    <Flag size={16} color={priority === p.value ? p.color : '#6B7280'} />
                    <Text style={[
                      styles.priorityText,
                      priority === p.value && { color: p.color, fontWeight: '600' }
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Échéance (optionnel)</Text>
              <View style={styles.quickDateButtons}>
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => setQuickDueDate(1)}
                >
                  <Clock size={14} color="#2563EB" />
                  <Text style={styles.quickDateText}>Dans 1h</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => setQuickDueDate(4)}
                >
                  <Clock size={14} color="#2563EB" />
                  <Text style={styles.quickDateText}>Dans 4h</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => setQuickDueDate(24)}
                >
                  <Clock size={14} color="#2563EB" />
                  <Text style={styles.quickDateText}>Demain</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.createButton, loading && styles.createButtonDisabled]} 
              onPress={handleCreate}
              disabled={loading || !title.trim()}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>
                {loading ? 'Création...' : 'Créer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  inputWithIconText: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    marginLeft: 8,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  priorityText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  quickDateText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})