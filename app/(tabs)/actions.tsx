import { Plus, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import {
  buildActionPlanPrompt,
  buildLocalActionPlan,
  formatActionPlanText,
} from '../../features/actions/actionPlan';
import { STATUS_FLOW } from '../../features/actions/constants';
import { useActivityLog } from '../../hooks/useActivityLog';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuth } from '../../hooks/useAuth';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import type { CorrectiveAction } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { AppEmptyState } from '../../shared/components/AppEmptyState';
import { AppScreenHeader } from '../../shared/components/AppScreenHeader';

export default function ActionsScreen() {
  const {
    actions,
    loading,
    createAction,
    updateActionStatus,
    isOverdue,
    getActionsByStatus,
  } = useCorrectiveActions();
  const { session, isDemoMode } = useAuth();
  const { isEnabled } = useAppSettings();
  const { logEvent } = useActivityLog();
  const isLocalDemo = isDemoMode && !session;

  const [viewMode, setViewMode] = useState<ActionsViewMode>('list');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [planAction, setPlanAction] = useState<CorrectiveAction | null>(null);
  const [planText, setPlanText] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planSource, setPlanSource] = useState<'ia' | 'local' | null>(null);

  const overdueCount = useMemo(
    () => actions.filter(isOverdue).length,
    [actions, isOverdue],
  );
  const openCount = getActionsByStatus('open').length;
  const inProgressCount = getActionsByStatus('in_progress').length;

  const handleCreate = async (payload: NewActionPayload) => {
    await createAction(payload);
    setCreateModalVisible(false);
  };

  const advanceStatus = (action: CorrectiveAction) => {
    const idx = STATUS_FLOW.indexOf(action.status);
    const next = idx >= 0 ? STATUS_FLOW[idx + 1] : undefined;
    if (next) {
      updateActionStatus(action.id, next);
      if (next === 'done') {
        logEvent({
          action: 'action_resolved',
          entityType: 'corrective_action',
          entityId: action.id,
          label: `Action corrective « ${action.title} » résolue.`,
        });
      }
    }
  };

  // Plan d'action correctif : IA en ligne si disponible, sinon plan proposé.
  const handleGeneratePlan = async (action: CorrectiveAction) => {
    setPlanAction(action);
    setPlanText(null);
    setPlanSource(null);
    setPlanLoading(true);

    const localPlan = formatActionPlanText(buildLocalActionPlan(action));
    const aiAvailable =
      !isLocalDemo && !!session && isEnabled('features.ai_assistant');

    if (!aiAvailable) {
      setPlanSource('local');
      setPlanText(localPlan);
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
      setPlanText(localPlan);
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppScreenHeader
        title="Plans d’action"
        titleTestID="page-actions-title"
        subtitle="Non-conformités & actions correctives"
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

      {viewMode === 'list' ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {actions.length === 0 && !loading && (
            <AppEmptyState
              icon={CheckCircle}
              title="Aucune action corrective ouverte"
              description="Les non-conformités relevées en audit génèrent automatiquement un plan d'action correctif."
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

      <ActionPlanModal
        visible={planAction !== null}
        subject={planAction?.title ?? ''}
        loading={planLoading}
        planText={planText}
        source={planSource}
        onClose={() => setPlanAction(null)}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
