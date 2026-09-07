import { Plus, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { ActionCard } from '../../features/actions/ActionCard';
import { ActionPlanModal } from '../../features/actions/ActionPlanModal';
import { ActionsKanban } from '../../features/actions/ActionsKanban';
import { ActionsStatsRow } from '../../features/actions/ActionsStatsRow';
import {
  ActionsViewToggle,
  type ActionsViewMode,
} from '../../features/actions/ActionsViewToggle';
import {
  CreateActionModal,
  type NewActionPayload,
} from '../../features/actions/CreateActionModal';
import { ResolveActionModal } from '../../features/actions/ResolveActionModal';
import {
  buildActionPlanPrompt,
  buildLocalActionPlan,
  formatActionPlanText,
  type ActionPlan,
} from '../../features/actions/actionPlan';
import {
  buildResolutionActivityLabel,
  buildResolutionRecord,
  isResolutionAuthorized,
  type ResolutionEvidencePayload,
} from '../../features/actions/actionResolution';
import { STATUS_FLOW } from '../../features/actions/constants';
import {
  isUploadableEvidenceUri,
  uploadEvidencePhoto,
} from '../../features/evidence/evidenceUpload';
import { useActivityLog } from '../../hooks/useActivityLog';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuth } from '../../hooks/useAuth';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import type { CorrectiveAction } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { AppEmptyState } from '../../shared/components/AppEmptyState';
import { AppScreenHeader } from '../../shared/components/AppScreenHeader';
import { colors } from '../../shared/styles/tokens';

export default function ActionsScreen() {
  const {
    actions,
    loading,
    createAction,
    updateActionStatus,
    isOverdue,
    getActionsByStatus,
  } = useCorrectiveActions();
  const { session, isDemoMode, profile } = useAuth();
  const { isEnabled } = useAppSettings();
  const { logEvent } = useActivityLog();
  const isLocalDemo = isDemoMode && !session;

  const [viewMode, setViewMode] = useState<ActionsViewMode>('list');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [planAction, setPlanAction] = useState<CorrectiveAction | null>(null);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [planText, setPlanText] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planSource, setPlanSource] = useState<'ia' | 'local' | null>(null);
  const [resolutionAction, setResolutionAction] =
    useState<CorrectiveAction | null>(null);
  const [resolutionPlan, setResolutionPlan] = useState<ActionPlan | null>(null);

  const overdueCount = useMemo(
    () => actions.filter(isOverdue).length,
    [actions, isOverdue],
  );
  const openCount = getActionsByStatus('open').length;
  const inProgressCount = getActionsByStatus('in_progress').length;

  const handleCreate = async (payload: NewActionPayload) => {
    const result = await createAction(payload);
    if (result.error) {
      Alert.alert('Erreur', String(result.error));
      return;
    }
    setCreateModalVisible(false);
  };

  const advanceStatus = (action: CorrectiveAction) => {
    const idx = STATUS_FLOW.indexOf(action.status);
    const next = idx >= 0 ? STATUS_FLOW[idx + 1] : undefined;
    if (!next) return;

    if (next === 'done') {
      setResolutionAction(action);
      setResolutionPlan(buildLocalActionPlan(action));
      return;
    }

    updateActionStatus(action.id, next);
  };

  const handleResolutionConfirm = async (
    payload: ResolutionEvidencePayload,
  ) => {
    if (!resolutionAction) return;
    const action = resolutionAction;

    // Garde-fou métier (au-delà de l'UI) : preuves obligatoires présentes ET
    // droit de validation manager si l'action l'exige. Un employé ne peut pas
    // clôturer seul une action nécessitant une validation manager.
    if (!isResolutionAuthorized(resolutionPlan, payload, profile?.role)) {
      Alert.alert(
        'Validation manager requise',
        'Cette action nécessite la validation d’un responsable habilité avant clôture.',
      );
      return;
    }

    // Preuve photo durable : en production, on téléverse l'URI locale dans le
    // bucket privé « evidence » et on persiste le chemin. En démo, l'URI locale
    // suffit (aucun réseau requis). Best-effort : un échec conserve l'URI.
    let finalPayload = payload;
    const uri = payload.proofPhotoUri;
    if (
      uri &&
      !isLocalDemo &&
      isUploadableEvidenceUri(uri) &&
      profile?.organization_id
    ) {
      const storagePath = await uploadEvidencePhoto({
        organizationId: profile.organization_id,
        entityType: 'corrective_action',
        entityId: action.id,
        uri,
        uploadedBy: profile.id ?? null,
      });
      if (storagePath) {
        finalPayload = { ...payload, proofPhotoUri: storagePath };
      } else {
        Alert.alert(
          'Preuve photo',
          'Le téléversement de la preuve a échoué. La photo locale est conservée mais ne sera pas accessible depuis un autre appareil.',
        );
      }
    }

    // Persiste les preuves de clôture (commentaire, exécutant, photo, validation).
    const record = buildResolutionRecord(finalPayload, {
      id: profile?.id ?? null,
      role: profile?.role ?? null,
    });
    updateActionStatus(action.id, 'done', record);
    logEvent({
      action: 'action_resolved',
      entityType: 'corrective_action',
      entityId: action.id,
      label: buildResolutionActivityLabel({
        title: action.title,
        evidence: finalPayload,
      }),
    });
    setResolutionAction(null);
    setResolutionPlan(null);
  };

  // Plan d'action correctif : IA en ligne si disponible, sinon plan proposé.
  const handleGeneratePlan = async (action: CorrectiveAction) => {
    setPlanAction(action);
    setPlanText(null);
    setPlan(null);
    setPlanSource(null);
    setPlanLoading(true);

    const localPlan = buildLocalActionPlan(action);
    const localPlanText = formatActionPlanText(localPlan);
    setPlan(localPlan);
    const aiAvailable =
      !isLocalDemo && !!session && isEnabled('features.ai_assistant');

    if (!aiAvailable) {
      setPlanSource('local');
      setPlanText(localPlanText);
      setPlanLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke<{
        reply?: string;
      }>('ai-assistant', {
        body: {
          messages: [{ role: 'user', content: buildActionPlanPrompt(action) }],
        },
      });
      if (error || !data?.reply) throw new Error('Réponse vide');
      setPlanSource('ia');
      setPlanText(data.reply);
    } catch {
      setPlanSource('local');
      setPlanText(localPlanText);
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppScreenHeader
        title="Actions correctives"
        titleTestID="page-actions-title"
        subtitle="Suivi des non-conformités et plans d'action"
        right={
          <TouchableOpacity
            testID="action-create-button"
            style={styles.addButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ActionsStatsRow
        open={openCount}
        inProgress={inProgressCount}
        overdue={overdueCount}
      />

      <ActionsViewToggle viewMode={viewMode} onChange={setViewMode} />

      {loading && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {viewMode === 'list' ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {actions.length === 0 && !loading && (
            <AppEmptyState
              icon={CheckCircle}
              title="Aucune action corrective ouverte"
              description={
                'Les non-conformités relevées en audit génèrent automatiquement ' +
                "un plan d'action correctif."
              }
            />
          )}
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              overdue={isOverdue(action)}
              onAdvance={advanceStatus}
              onGeneratePlan={handleGeneratePlan}
            />
          ))}
        </ScrollView>
      ) : (
        <ActionsKanban
          getActionsByStatus={getActionsByStatus}
          isOverdue={isOverdue}
          onAdvance={advanceStatus}
          onGeneratePlan={handleGeneratePlan}
        />
      )}

      <CreateActionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreate}
      />

      <ResolveActionModal
        visible={resolutionAction !== null}
        action={resolutionAction}
        plan={resolutionPlan}
        onClose={() => {
          setResolutionAction(null);
          setResolutionPlan(null);
        }}
        onConfirm={handleResolutionConfirm}
      />

      <ActionPlanModal
        visible={planAction !== null}
        subject={planAction?.title ?? ''}
        loading={planLoading}
        plan={plan}
        planText={planText}
        source={planSource}
        onClose={() => {
          setPlanAction(null);
          setPlan(null);
          setPlanText(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  loadingBanner: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
