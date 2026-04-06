import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Search, Filter, Plus, MapPin, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, Camera, FileText } from 'lucide-react-native';
import CameraModal from '../../components/CameraModal';
import { useAudits } from '../../hooks/useAudits';
import { audits as defaultAudits } from '../../data/audits';

export default function AuditsScreen() {
  const { audits: dbAudits, loading, createAudit, updateAuditStatus, addPhotoToAudit } = useAudits();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraAuditId, setCameraAuditId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Utiliser les audits DB s'ils existent, sinon fallback sur les données démo
  const audits = useMemo(() => {
    if (dbAudits.length > 0) {
      return dbAudits.map((a) => ({
        id: a.id,
        title: a.title,
        location: a.location || '',
        status: a.status,
        date: a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '',
        score: a.score,
        issues: a.issues_count,
      }));
    }
    return defaultAudits;
  }, [dbAudits]);

  // Stats dynamiques
  const pendingCount = audits.filter((a) => a.status === 'pending').length;
  const inProgressCount = audits.filter((a) => a.status === 'in_progress').length;
  const completedCount = audits.filter((a) => a.status === 'completed').length;

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
      case 'pending': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'pending': return 'À faire';
      default: return 'Inconnu';
    }
  };

  const handleCreateAudit = async () => {
    Alert.prompt
      ? Alert.prompt('Nouvel audit', 'Titre de l\'audit :', async (title) => {
          if (!title?.trim()) return;
          const result = await createAudit({ title: title.trim(), status: 'pending' });
          if (result.error) {
            Alert.alert('Erreur', String(result.error));
          } else {
            Alert.alert('Succès', 'Audit créé avec succès !');
          }
        })
      : Alert.alert(
          'Nouvel audit',
          'Fonctionnalité de création d\'audit disponible.',
          [
            { text: 'Créer audit test', onPress: async () => {
                const result = await createAudit({
                  title: `Audit ${new Date().toLocaleDateString('fr-FR')}`,
                  location: 'Magasin principal',
                  status: 'pending',
                });
                if (result.error) {
                  Alert.alert('Erreur', String(result.error));
                } else {
                  Alert.alert('Succès', 'Audit créé avec succès !');
                }
              },
            },
            { text: 'Annuler', style: 'cancel' },
          ],
        );
  };

  const handlePhotoTaken = async (uri: string, analysis?: any, annotations?: string[]) => {
    if (cameraAuditId) {
      await addPhotoToAudit(cameraAuditId, uri);
    }
    console.log('Photo prise', uri, annotations);
  };

  const handleOpenCamera = (auditId?: string) => {
    setCameraAuditId(auditId || null);
    setCameraVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Audits</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
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
          <Text style={styles.quickStatLabel}>Terminés</Text>
        </View>
      </View>

      {/* Create New Audit Button */}
      <TouchableOpacity style={styles.createButton} onPress={handleCreateAudit}>
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Créer un audit</Text>
      </TouchableOpacity>

      {/* Audits List */}
      <ScrollView style={styles.auditsList}>
        {loading && audits.length === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement des audits...</Text>
          </View>
        )}
        {audits.map((audit) => {
          const StatusIcon = getStatusIcon(audit.status);
          return (
            <TouchableOpacity key={audit.id} style={styles.auditCard}>
              <View style={styles.auditHeader}>
                <View style={styles.auditTitleSection}>
                  <Text style={styles.auditTitle}>{audit.title}</Text>
                  <View style={styles.auditLocation}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.auditLocationText}>{audit.location}</Text>
                  </View>
                </View>
                <View style={[styles.auditStatus, { backgroundColor: `${getStatusColor(audit.status)}20` }]}>
                  <StatusIcon size={16} color={getStatusColor(audit.status)} />
                  <Text style={[styles.auditStatusText, { color: getStatusColor(audit.status) }]}>
                    {getStatusText(audit.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.auditDetails}>
                <Text style={styles.auditDate}>{audit.date}</Text>
                {audit.score != null && (
                  <View style={styles.auditScore}>
                    <Text style={styles.auditScoreText}>Score: {audit.score}%</Text>
                  </View>
                )}
                {audit.issues > 0 && (
                  <View style={styles.auditIssues}>
                    <AlertCircle size={14} color="#F59E0B" />
                    <Text style={styles.auditIssuesText}>{audit.issues} problèmes</Text>
                  </View>
                )}
              </View>

              <View style={styles.auditActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenCamera(audit.id)}>
                  <Camera size={16} color="#2563EB" />
                  <Text style={styles.actionButtonText}>Photos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <FileText size={16} color="#2563EB" />
                  <Text style={styles.actionButtonText}>Rapport</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => handleOpenCamera()}>
        <Camera size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onPhotoTaken={handlePhotoTaken}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  auditsList: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  auditCard: {
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
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  auditTitleSection: {
    flex: 1,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  auditLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditLocationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  auditStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  auditStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  auditDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  auditDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  auditScore: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  auditScoreText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
  auditIssues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditIssuesText: {
    fontSize: 12,
    color: '#D97706',
    marginLeft: 4,
  },
  auditActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
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
