import {
  Search,
  Plus,
  MapPin,
  CircleCheck as CheckCircle,
  Clock,
  CircleAlert as AlertCircle,
  Camera,
  X,
  Play,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
} from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';

import CameraModal from '../../components/CameraModal';
import { audits as defaultAudits } from '../../data/audits';
import { useAudits } from '../../hooks/useAudits';
import { exportAuditsAsCSV } from '../../utils/exportAudits';

const AUDIT_TEMPLATES = [
  { id: 't1', name: 'HACCP alimentaire', icon: '🧫', category: 'haccp', color: '#EFF6FF', accent: '#2563EB' },
  { id: 't2', name: 'Hygiène générale', icon: '🧹', category: 'hygiene', color: '#F0FDF4', accent: '#16A34A' },
  { id: 't3', name: 'Sécurité incendie', icon: '🔥', category: 'securite', color: '#FFF7ED', accent: '#EA580C' },
  { id: 't4', name: 'Contrôle DLC & qualité', icon: '📦', category: 'qualite', color: '#FEFCE8', accent: '#CA8A04' },
] as const;

export default function AuditsScreen() {
  const {
    audits: dbAudits,
    loading,
    createAudit,
    updateAuditStatus,
    addPhotoToAudit,
  } = useAudits();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraAuditId, setCameraAuditId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newAuditTitle, setNewAuditTitle] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const audits = useMemo(() => {
    const source =
      dbAudits.length > 0
        ? dbAudits.map((a) => ({
            id: a.id,
            title: a.title,
            location: a.location || '',
            status: a.status,
            date: a.created_at
              ? new Date(a.created_at).toLocaleDateString('fr-FR')
              : '',
            score: a.score,
            issues: a.issues_count,
          }))
        : defaultAudits;

    return source.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dbAudits, searchQuery, statusFilter]);

  // Stats dynamiques
  const pendingCount = audits.filter((a) => a.status === 'pending').length;
  const inProgressCount = audits.filter(
    (a) => a.status === 'in_progress',
  ).length;
  const completedCount = audits.filter((a) => a.status === 'completed').length;

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
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'pending':
        return 'À faire';
      default:
        return 'Inconnu';
    }
  };

  const handleCreateAudit = (prefillTitle?: string) => {
    setNewAuditTitle(prefillTitle ?? '');
    setCreateModalVisible(true);
  };

  const handleConfirmCreateAudit = async () => {
    const title =
      newAuditTitle.trim() || `Audit ${new Date().toLocaleDateString('fr-FR')}`;
    setCreateModalVisible(false);
    const result = await createAudit({
      title,
      location: 'Magasin principal',
      status: 'pending',
    });
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
    } else {
      Alert.alert('Succès', 'Audit créé avec succès !');
    }
  };

  const handlePhotoTaken = async (
    uri: string,
    analysis?: any,
    annotations?: string[],
  ) => {
    if (cameraAuditId) {
      await addPhotoToAudit(cameraAuditId, uri);
    }
    console.log('Photo prise', uri, annotations);
  };

  const handleOpenCamera = (auditId?: string) => {
    setCameraAuditId(auditId || null);
    setCameraVisible(true);
  };

  const handleStatusChange = async (auditId: string, currentStatus: string) => {
    if (currentStatus === 'pending') {
      const result = await updateAuditStatus(auditId, 'in_progress');
      if (!result.error)
        Alert.alert('Audit démarré', "L'audit est maintenant en cours.");
      else Alert.alert('Erreur', String(result.error));
    } else if (currentStatus === 'in_progress') {
      const result = await updateAuditStatus(auditId, 'completed');
      if (!result.error)
        Alert.alert('Audit terminé', "L'audit a été complété avec succès !");
      else Alert.alert('Erreur', String(result.error));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Audits</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Search size={20} color={showSearch ? '#2563EB' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => exportAuditsAsCSV(dbAudits)}
          >
            <Download size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un audit..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
      >
        {[
          { key: 'all', label: 'Tous' },
          { key: 'pending', label: 'À faire' },
          { key: 'in_progress', label: 'En cours' },
          { key: 'completed', label: 'Terminés' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              statusFilter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
      <TouchableOpacity style={styles.createButton} onPress={() => handleCreateAudit()}>
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Créer un audit</Text>
      </TouchableOpacity>

      {/* Audits List */}
      <ScrollView style={styles.auditsList}>
        {/* Template library */}
        <TouchableOpacity
          style={styles.templateHeader}
          onPress={() => setShowTemplates(!showTemplates)}
        >
          <View style={styles.templateHeaderLeft}>
            <BookOpen size={16} color="#2563EB" />
            <Text style={styles.templateHeaderText}>Bibliothèque de modèles</Text>
          </View>
          {showTemplates ? (
            <ChevronDown size={16} color="#6B7280" />
          ) : (
            <ChevronRight size={16} color="#6B7280" />
          )}
        </TouchableOpacity>
        {showTemplates && (
          <View style={styles.templateGrid}>
            {AUDIT_TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                style={[styles.templateCard, { backgroundColor: tpl.color }]}
                onPress={() => handleCreateAudit(tpl.name)}
              >
                <Text style={styles.templateEmoji}>{tpl.icon}</Text>
                <Text style={[styles.templateName, { color: tpl.accent }]}>
                  {tpl.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
                    <Text style={styles.auditLocationText}>
                      {audit.location}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.auditStatus,
                    { backgroundColor: `${getStatusColor(audit.status)}20` },
                  ]}
                >
                  <StatusIcon size={16} color={getStatusColor(audit.status)} />
                  <Text
                    style={[
                      styles.auditStatusText,
                      { color: getStatusColor(audit.status) },
                    ]}
                  >
                    {getStatusText(audit.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.auditDetails}>
                <Text style={styles.auditDate}>{audit.date}</Text>
                {audit.score != null && (
                  <View style={styles.auditScore}>
                    <Text style={styles.auditScoreText}>
                      Score: {audit.score}%
                    </Text>
                  </View>
                )}
                {audit.issues > 0 && (
                  <View style={styles.auditIssues}>
                    <AlertCircle size={14} color="#F59E0B" />
                    <Text style={styles.auditIssuesText}>
                      {audit.issues} problèmes
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.auditActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleOpenCamera(audit.id)}
                >
                  <Camera size={16} color="#2563EB" />
                  <Text style={styles.actionButtonText}>Photos</Text>
                </TouchableOpacity>
                {audit.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.startActionButton]}
                    onPress={() => handleStatusChange(audit.id, audit.status)}
                  >
                    <Play size={16} color="#F59E0B" />
                    <Text
                      style={[styles.actionButtonText, { color: '#F59E0B' }]}
                    >
                      Démarrer
                    </Text>
                  </TouchableOpacity>
                )}
                {audit.status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeActionButton]}
                    onPress={() => handleStatusChange(audit.id, audit.status)}
                  >
                    <CheckCircle size={16} color="#10B981" />
                    <Text
                      style={[styles.actionButtonText, { color: '#10B981' }]}
                    >
                      Terminer
                    </Text>
                  </TouchableOpacity>
                )}
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

      {/* Create Audit Modal */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvel audit</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={newAuditTitle}
              onChangeText={setNewAuditTitle}
              placeholder="Titre de l'audit"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmCreateAudit}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    color: '#111827',
  },
  filtersRow: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 52,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  startActionButton: {
    backgroundColor: '#FEF3C7',
  },
  completeActionButton: {
    backgroundColor: '#DCFCE7',
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
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
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
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  templateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  templateCard: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  templateEmoji: {
    fontSize: 28,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
