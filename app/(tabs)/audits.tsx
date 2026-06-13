import {
  Search,
  Plus,
  MapPin,
  CircleCheck as CheckCircle,
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
import { ProfessionalAuditModal } from '../../features/audits/ProfessionalAuditModal';
import { QuestionnaireModal } from '../../features/audits/QuestionnaireModal';
import {
  toAuditListItems,
  getAuditStatusColor,
  getAuditStatusIcon,
  getAuditStatusText,
} from '../../features/audits/auditListModel';
import { AUDIT_QUESTIONS } from '../../features/audits/constants';
import type { AuditResponseDraft } from '../../features/audits/scoring';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuditTemplates } from '../../hooks/useAuditTemplates';
import { useAudits } from '../../hooks/useAudits';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import type { AuditTemplate } from '../../lib/supabase';
import { exportAuditReport } from '../../utils/auditReport';
import { exportAuditsAsCSV } from '../../utils/exportAudits';

export default function AuditsScreen() {
  const {
    audits: dbAudits,
    loading,
    createAudit,
    updateAuditStatus,
    completeAudit,
    addPhotoToAudit,
  } = useAudits();
  const {
    templates,
    loading: templatesLoading,
    getItemsForTemplate,
  } = useAuditTemplates();
  const { createAction } = useCorrectiveActions();
  // Réglage back-office : création auto d'actions sur non-conformité.
  const { isEnabled } = useAppSettings();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraAuditId, setCameraAuditId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newAuditTitle, setNewAuditTitle] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [showTemplates, setShowTemplates] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [questionnaireAuditId, setQuestionnaireAuditId] = useState<
    string | null
  >(null);
  const [professionalAuditId, setProfessionalAuditId] = useState<string | null>(
    null,
  );

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) || null;
  const professionalAudit =
    dbAudits.find((audit) => audit.id === professionalAuditId) || null;
  const professionalTemplate =
    templates.find(
      (template) => template.id === professionalAudit?.template_id,
    ) || null;
  const professionalItems = useMemo(
    () =>
      professionalTemplate ? getItemsForTemplate(professionalTemplate.id) : [],
    [getItemsForTemplate, professionalTemplate],
  );

  const audits = useMemo(
    () => toAuditListItems(dbAudits, searchQuery, statusFilter),
    [dbAudits, searchQuery, statusFilter],
  );

  // Stats dynamiques
  const pendingCount = audits.filter((a) => a.status === 'pending').length;
  const inProgressCount = audits.filter(
    (a) => a.status === 'in_progress',
  ).length;
  const completedCount = audits.filter((a) => a.status === 'completed').length;

  const handleCreateAudit = (template?: AuditTemplate) => {
    setSelectedTemplateId(template?.id ?? null);
    setNewAuditTitle(template?.name ?? '');
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
      template_id: selectedTemplateId,
    });
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
    } else {
      setSelectedTemplateId(null);
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
      const audit = dbAudits.find((candidate) => candidate.id === auditId);
      const templateItems = audit?.template_id
        ? getItemsForTemplate(audit.template_id)
        : [];
      if (audit?.template_id && templateItems.length > 0) {
        setProfessionalAuditId(auditId);
      } else {
        // Questionnaire historique pour les audits libres ou anciens.
        setQuestionnaireAuditId(auditId);
      }
    }
  };

  const handleSubmitQuestionnaire = async (answers: boolean[]) => {
    if (!questionnaireAuditId) return;
    const auditId = questionnaireAuditId;
    setQuestionnaireAuditId(null);

    const total = AUDIT_QUESTIONS.length;
    const conform = answers.filter(Boolean).length;
    const issues = total - conform;
    const score = Math.round((conform / total) * 100);

    const result = await completeAudit(auditId, score, issues);
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
      return;
    }

    // Une action corrective par non-conformité, liée à l'audit
    // (désactivable depuis le back-office : audits.auto_actions).
    let created = 0;
    const autoActions = isEnabled('audits.auto_actions');
    for (let i = 0; autoActions && i < AUDIT_QUESTIONS.length; i++) {
      if (!answers[i]) {
        const res = await createAction({
          title: `Non-conformité : ${AUDIT_QUESTIONS[i]}`,
          description: `Détectée lors de l'audit (score ${score}%).`,
          audit_id: auditId,
          priority: 'high',
        });
        if (!res.error) created++;
      }
    }

    Alert.alert(
      'Audit terminé',
      `Score : ${score}%${
        created > 0
          ? `\n${created} action${created > 1 ? 's' : ''} corrective${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''} automatiquement.`
          : '\nAucune non-conformité détectée.'
      }`,
    );
  };

  const handleSubmitProfessionalAudit = async (
    responses: AuditResponseDraft[],
    score: number,
    issuesCount: number,
  ) => {
    if (!professionalAuditId) return;
    const auditId = professionalAuditId;
    const result = await completeAudit(auditId, score, issuesCount, responses);
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
      return;
    }

    let created = 0;
    const autoActions = isEnabled('audits.auto_actions');
    for (const response of responses.filter(
      (candidate) => autoActions && !candidate.is_compliant,
    )) {
      const item = professionalItems.find(
        (candidate) => candidate.id === response.item_id,
      );
      if (!item) continue;
      const savedResponse = result.responses?.find(
        (candidate) => candidate.item_id === response.item_id,
      );
      const actionResult = await createAction({
        title: `Non-conformité : ${item.question}`,
        description: response.comment?.trim()
          ? `${response.comment.trim()} (score de l'audit : ${score}%).`
          : `Détectée lors de l'audit (score ${score}%).`,
        audit_id: auditId,
        audit_response_id: savedResponse?.id ?? null,
        priority: item.points >= 10 ? 'critical' : 'high',
      });
      if (!actionResult.error) created++;
    }

    setProfessionalAuditId(null);
    Alert.alert(
      'Audit terminé',
      `Score : ${score}%${
        created > 0
          ? `\n${created} action${created > 1 ? 's' : ''} corrective${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''} automatiquement.`
          : '\nAucune non-conformité détectée.'
      }`,
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} testID="page-audits-title">
          Audits
        </Text>
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
      <TouchableOpacity
        testID="audit-create-button"
        style={styles.createButton}
        onPress={() => handleCreateAudit()}
      >
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
            <Text style={styles.templateHeaderText}>
              Bibliothèque de modèles
            </Text>
          </View>
          {showTemplates ? (
            <ChevronDown size={16} color="#6B7280" />
          ) : (
            <ChevronRight size={16} color="#6B7280" />
          )}
        </TouchableOpacity>
        {showTemplates && (
          <View style={styles.templateGrid}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                testID={`audit-template-${template.id}`}
                style={styles.templateCard}
                onPress={() => handleCreateAudit(template)}
              >
                <BookOpen size={22} color="#2563EB" />
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateMeta}>
                  {template.estimated_duration || 20} min ·{' '}
                  {getItemsForTemplate(template.id).length} critères
                </Text>
              </TouchableOpacity>
            ))}
            {templatesLoading && (
              <Text style={styles.templateLoading}>
                Chargement des modèles...
              </Text>
            )}
            {!templatesLoading && templates.length === 0 && (
              <Text style={styles.templateLoading}>
                Aucun modèle disponible. Créez un audit libre.
              </Text>
            )}
          </View>
        )}

        {loading && audits.length === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement des audits...</Text>
          </View>
        )}
        {audits.map((audit) => {
          const StatusIcon = getAuditStatusIcon(audit.status);
          return (
            <TouchableOpacity
              key={audit.id}
              testID={`audit-card-${audit.id}`}
              style={styles.auditCard}
            >
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
                    {
                      backgroundColor: `${getAuditStatusColor(audit.status)}20`,
                    },
                  ]}
                >
                  <StatusIcon
                    size={16}
                    color={getAuditStatusColor(audit.status)}
                  />
                  <Text
                    style={[
                      styles.auditStatusText,
                      { color: getAuditStatusColor(audit.status) },
                    ]}
                  >
                    {getAuditStatusText(audit.status)}
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
                  <Text style={styles.actionButtonText}>Preuve photo</Text>
                </TouchableOpacity>
                {audit.status === 'completed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.reportActionButton]}
                    onPress={() => {
                      const fullAudit = dbAudits.find((a) => a.id === audit.id);
                      if (fullAudit) exportAuditReport(fullAudit);
                    }}
                  >
                    <Download size={16} color="#7C3AED" />
                    <Text
                      style={[styles.actionButtonText, { color: '#7C3AED' }]}
                    >
                      Rapport
                    </Text>
                  </TouchableOpacity>
                )}
                {audit.status === 'pending' && (
                  <TouchableOpacity
                    testID={`audit-start-${audit.id}`}
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
                    testID={`audit-finish-${audit.id}`}
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
              testID="audit-create-title-input"
              style={styles.modalInput}
              value={newAuditTitle}
              onChangeText={setNewAuditTitle}
              placeholder="Titre de l'audit"
              autoFocus
            />
            <Text style={styles.selectedTemplateText}>
              {selectedTemplate
                ? `Modèle : ${selectedTemplate.name}`
                : 'Audit libre : questionnaire standard à la clôture'}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="audit-create-submit"
                style={styles.modalConfirmButton}
                onPress={handleConfirmCreateAudit}
              >
                <Text style={styles.modalConfirmText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <QuestionnaireModal
        visible={questionnaireAuditId !== null}
        onClose={() => setQuestionnaireAuditId(null)}
        onSubmit={handleSubmitQuestionnaire}
      />
      <ProfessionalAuditModal
        visible={professionalAuditId !== null}
        template={professionalTemplate}
        items={professionalItems}
        onClose={() => setProfessionalAuditId(null)}
        onSubmit={handleSubmitProfessionalAudit}
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
  reportActionButton: {
    backgroundColor: '#EDE9FE',
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
  selectedTemplateText: {
    marginTop: -6,
    marginBottom: 16,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
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
    backgroundColor: '#EFF6FF',
    gap: 8,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1D4ED8',
  },
  templateMeta: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  templateLoading: {
    paddingVertical: 12,
    color: '#6B7280',
    fontSize: 13,
  },
});
