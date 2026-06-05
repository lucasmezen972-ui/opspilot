import {
  X,
  Camera,
  MapPin,
  Calendar,
  FileText,
  Sparkles,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';

import { useAudits } from '../hooks/useAudits';

interface AuditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuditModal({
  visible,
  onClose,
  onSuccess,
}: AuditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { createAudit } = useAudits();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setDueDate('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', "Veuillez saisir un titre d'audit");
      return;
    }

    if (!location.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un lieu');
      return;
    }

    setLoading(true);

    try {
      let dueDateISO: string | undefined;
      if (dueDate) {
        const parsed = new Date(dueDate);
        if (isNaN(parsed.getTime())) {
          Alert.alert('Erreur', 'Format de date invalide. Utilisez YYYY-MM-DD HH:MM');
          setLoading(false);
          return;
        }
        dueDateISO = parsed.toISOString();
      }

      const result = await createAudit({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        due_date: dueDateISO,
      });

      if (result.error) {
        Alert.alert('Erreur', "Impossible de créer l'audit");
        return;
      }

      Alert.alert('Succès', 'Audit créé avec succès !', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            onClose();
            onSuccess?.();
          },
        },
      ]);
    } catch (error) {
      console.error('Erreur création audit:', error);
      Alert.alert('Erreur', "Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Templates d'audit prédéfinis
  const auditTemplates = [
    {
      title: 'Contrôle rayon frais',
      description: 'Vérification des températures, DLC et présentation',
      location: 'Rayon frais',
      icon: '❄️',
    },
    {
      title: 'Audit hygiène HACCP',
      description: "Contrôle des protocoles d'hygiène et sécurité alimentaire",
      location: 'Zone préparation',
      icon: '🧽',
    },
    {
      title: 'Contrôle sécurité',
      description: 'Vérification des équipements et consignes de sécurité',
      location: 'Magasin général',
      icon: '🛡️',
    },
    {
      title: 'Audit merchandising',
      description: 'Contrôle de la présentation produits et PLV',
      location: 'Surface de vente',
      icon: '🏷️',
    },
  ];

  const applyTemplate = (template: (typeof auditTemplates)[0]) => {
    setTitle(template.title);
    setDescription(template.description);
    setLocation(template.location);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nouvel Audit</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Templates rapides */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Templates rapides</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templatesScroll}
            >
              {auditTemplates.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.templateCard}
                  onPress={() => applyTemplate(template)}
                >
                  <Text style={styles.templateIcon}>{template.icon}</Text>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Formulaire */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails de l'audit</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Titre de l'audit *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Contrôle rayon frais"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez les points à contrôler..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lieu *</Text>
              <View style={styles.inputWithIcon}>
                <MapPin size={20} color="#6B7280" />
                <TextInput
                  style={styles.inputWithIconText}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Ex: Rayon frais - Zone A"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date d'échéance (optionnelle)</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={20} color="#6B7280" />
                <TextInput
                  style={styles.inputWithIconText}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD HH:MM"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <FileText size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {loading ? 'Création...' : "Créer l'audit"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
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
  templatesScroll: {
    flexDirection: 'row',
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
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
    color: '#111827',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  inputWithIconText: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
