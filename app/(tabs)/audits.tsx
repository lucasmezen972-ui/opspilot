import { Search, Plus, Camera, X, Download } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';

import CameraModal from '../../components/CameraModal';
import { AuditFilters } from '../../features/audits/AuditFilters';
import { AuditListCard } from '../../features/audits/AuditListCard';
import { AuditQuickStats } from '../../features/audits/AuditQuickStats';
import { AuditTemplateLibrary } from '../../features/audits/AuditTemplateLibrary';
import { CreateAuditModal } from '../../features/audits/CreateAuditModal';
import { ProfessionalAuditModal } from '../../features/audits/ProfessionalAuditModal';
import { QuestionnaireModal } from '../../features/audits/QuestionnaireModal';
import {
  toAuditListItems,
  getAuditCounts,
} from '../../features/audits/auditListModel';
import { AUDIT_QUESTIONS } from '../../features/audits/constants';
import type { AuditResponseDraft } from '../../features/audits/scoring';
import { useActivityLog } from '../../hooks/useActivityLog';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuditTemplates } from '../../hooks/useAuditTemplates';
import { useAudits } from '../../hooks/useAudits';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import type { AuditTemplate } from '../../lib/supabase';
import { AppButton } from '../../shared/components/AppButton';
import { AppLoadingState } from '../../shared/components/AppLoadingState';
import { shadow } from '../../shared/styles/tokens';
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
    getAuditResponses,
  } = useAudits();
  const {
    templates,
    loading: templatesLoading,
    getItemsForTemplate,
  } = useAuditTemplates();
  const { createAction, actions } = useCorrectiveActions();
  const { logEvent } = useActivityLog();
  // Réglage back-office : création auto d'actions sur non-conformité.
  const { isEnabled } = useAppSettings();

  const logAuditCompleted = (auditId: string, score: number) => {
    const audit = dbAudits.find((a) => a.id === auditId);
    logEvent({
      action: 'audit_completed',
      entityType: 'audit',
      entityId: auditId,
      label: `Audit « ${audit?.title ?? 'audit'} » clôturé (score ${score} %).`,
    });
  };
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
    templates.find((template) => template.id === selectedTemplateId) ?? null;
  const professionalAudit =
    dbAudits.find((audit) => audit.id === professionalAuditId) ?? null;
  const professionalTemplate =
    templates.find(
      (template) => template.id === professionalAudit?.template_id,
    ) ?? null;
  const professionalItems = useMemo(
    () =>
      professionalTemplate ? getItemsForTemplate(professionalTemplate.id) : [],
    [getItemsForTemplate, professionalTemplate],
  );

  const audits = useMemo(
    () => toAuditListItems(dbAudits, searchQuery, statusFilter),
    [dbAudits, searchQuery, statusFilter],
  );

  const counts = useMemo(() => getAuditCounts(audits), [audits]);

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
      Alert.alert(
        'Audit créé',
        "L'audit a été ajouté à votre liste de contrôles.",
      );
    }
  };

  const handlePhotoTaken = async (
    uri: string,
    _analysis?: any,
    _annotations?: string[],
  ) => {
    if (cameraAuditId) {
      await addPhotoToAudit(cameraAuditId, uri);
    }
  };

  const handleOpenCamera = (auditId?: string) => {
    setCameraAuditId(auditId ?? null);
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
    logAuditCompleted(auditId, score);

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
    logAuditCompleted(auditId, score);

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

  const handleExportReport = async (auditId: string) => {
    const fullAudit = dbAudits.find((a) => a.id === auditId);
    if (!fullAudit) return;
    const responses = await getAuditResponses(auditId);
    const items = fullAudit.template_id
      ? getItemsForTemplate(fullAudit.template_id)
      : [];
    const auditActions = actions.filter((a) => a.audit_id === auditId);
    await exportAuditReport(fullAudit, {
      responses,
      items,
      actions: auditActions,
    });
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

      <AuditFilters statusFilter={statusFilter} onChange={setStatusFilter} />

      <AuditQuickStats counts={counts} />

      {/* Create New Audit Button */}
      <AppButton
        testID="audit-create-button"
        label="Créer un audit"
        icon={Plus}
        size="lg"
        onPress={() => handleCreateAudit()}
        style={styles.createButton}
      />

      {/* Audits List */}
      <ScrollView style={styles.auditsList}>
        <AuditTemplateLibrary
          templates={templates}
          expanded={showTemplates}
          loading={templatesLoading}
          onToggle={() => setShowTemplates(!showTemplates)}
          onSelectTemplate={(template) => handleCreateAudit(template)}
          getItemCount={(templateId) => getItemsForTemplate(templateId).length}
        />

        {loading && audits.length === 0 && (
          <AppLoadingState
            testID="audit-loading"
            label="Chargement des audits..."
          />
        )}
        {audits.map((audit) => (
          <AuditListCard
            key={audit.id}
            audit={audit}
            onOpenCamera={handleOpenCamera}
            onExportReport={handleExportReport}
            onChangeStatus={handleStatusChange}
          />
        ))}
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

      <CreateAuditModal
        visible={createModalVisible}
        title={newAuditTitle}
        selectedTemplateName={selectedTemplate?.name ?? null}
        onChangeTitle={setNewAuditTitle}
        onClose={() => setCreateModalVisible(false)}
        onConfirm={handleConfirmCreateAudit}
      />

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
    letterSpacing: -0.4,
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
  createButton: {
    margin: 20,
  },
  auditsList: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
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
    ...shadow.floating,
  },
});
