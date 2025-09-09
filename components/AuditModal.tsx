import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native'
import { X, Plus, MapPin, Calendar, Clock, FileText, Camera } from 'lucide-react-native'
import { useAudits } from '../hooks/useAudits'

interface AuditModalProps {
  visible: boolean
  onClose: () => void
}

export default function AuditModal({ visible, onClose }: AuditModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { createAudit } = useAudits()

  // Templates d'audit prédéfinis
  const auditTemplates = [
    { id: 'frais', title: 'Contrôle Rayon Frais', location: 'Rayon frais', duration: '15-20 min' },
    { id: 'securite', title: 'Audit Sécurité Alimentaire', location: 'Zone de préparation', duration: '30-45 min' },
    { id: 'hygiene', title: 'Contrôle Hygiène', location: 'Ensemble du magasin', duration: '20-30 min' },
    { id: 'merchandising', title: 'Audit Merchandising', location: 'Rayons centraux', duration: '25-35 min' },
    { id: 'stock', title: 'Vérification Stock & DLC', location: 'Réserve et rayons', duration: '40-60 min' }
  ]

  const selectTemplate = (template: any) => {
    setTitle(template.title)
    setLocation(template.location)
    Alert.alert('Template sélectionné', `"${template.title}" - Durée estimée: ${template.duration}`)
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Le titre est obligatoire')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🆕 Création audit:', title)
      
      const result = await createAudit({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        due_date: dueDate || undefined
      })

      if (result.error) {
        setError('Erreur lors de la création de l\'audit')
        console.error(result.error)
        Alert.alert('Erreur', 'Impossible de créer l\'audit')
      } else {
        console.log('✅ Audit créé avec succès')
        Alert.alert('Succès', 'Audit créé avec succès !', [
          { text: 'Voir les audits', onPress: () => { handleClose(); /* navigation */ } },
          { text: 'Créer un autre', onPress: resetForm },
          { text: 'Fermer', onPress: handleClose }
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

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLocation('')
    setDueDate('')
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const setQuickDueDate = (hours: number) => {
    const dueDate = new Date()
    dueDate.setHours(dueDate.getHours() + hours)
    setDueDate(dueDate.toISOString())
    Alert.alert('Échéance définie', `Dans ${hours}h: ${dueDate.toLocaleString('fr-FR')}`)
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
            <Text style={styles.title}>Créer un audit</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.form}>
            {/* Templates rapides */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Templates rapides</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesList}>
                {auditTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.templateCard}
                    onPress={() => selectTemplate(template)}
                  >
                    <FileText size={20} color="#2563EB" />
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <Text style={styles.templateDuration}>{template.duration}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Titre de l'audit *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Contrôle rayon frais matinal"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez l'objectif et les points à contrôler..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Localisation</Text>
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
          </ScrollView>

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
                {loading ? 'Création...' : 'Créer l\'audit'}
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
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
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
    marginHorizontal: 20,
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
    flex: 1,
    paddingHorizontal: 20,
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
  templatesList: {
    flexDirection: 'row',
  },
  templateCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  templateDuration: {
    fontSize: 10,
    color: '#6B7280',
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
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    flex: 2,
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