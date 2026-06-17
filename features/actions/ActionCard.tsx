import {
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Calendar,
  Flag,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { buildLocalActionPlan } from './actionPlan';
import { PRIORITY_COLORS, PRIORITY_LABELS } from './constants';
import type { CorrectiveAction } from '../../lib/supabase';

interface ActionCardProps {
  action: CorrectiveAction;
  overdue: boolean;
  compact?: boolean;
  onAdvance: (action: CorrectiveAction) => void;
  onGeneratePlan?: (action: CorrectiveAction) => void;
}

export function ActionCard({
  action,
  overdue,
  compact = false,
  onAdvance,
  onGeneratePlan,
}: ActionCardProps) {
  const plan = buildLocalActionPlan(action);
  const requirements = getRequirementLabels(plan);

  return (
    <View
      testID={`action-card-${action.id}`}
      style={[styles.card, overdue && styles.cardOverdue]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: PRIORITY_COLORS[action.priority] + '22' },
          ]}
        >
          <Flag size={12} color={PRIORITY_COLORS[action.priority]} />
          <Text
            style={[
              styles.priorityText,
              { color: PRIORITY_COLORS[action.priority] },
            ]}
          >
            {PRIORITY_LABELS[action.priority]}
          </Text>
        </View>
        {overdue && (
          <View style={styles.overdueBadge}>
            <AlertTriangle size={12} color="#DC2626" />
            <Text style={styles.overdueText}>En retard</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={compact ? 2 : 3}>
        {action.title}
      </Text>
      {!compact && !!action.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {action.description}
        </Text>
      )}

      {!compact && (
        <View
          style={styles.executionPanel}
          testID={`action-execution-${action.id}`}
        >
          <View style={styles.executionHeader}>
            <ShieldCheck size={13} color="#2563EB" />
            <Text style={styles.executionTitle}>{plan.category}</Text>
          </View>
          <Text style={styles.executionDeadline}>{plan.deadlineLabel}</Text>
          {requirements.length > 0 && (
            <Text style={styles.executionRequirements} numberOfLines={2}>
              {requirements.join(' · ')}
            </Text>
          )}
        </View>
      )}

      {action.status === 'done' && hasResolutionEvidence(action) && (
        <View
          style={styles.resolutionPanel}
          testID={`action-resolution-summary-${action.id}`}
        >
          <View style={styles.resolutionHeader}>
            <CheckCircle size={13} color="#10B981" />
            <Text style={styles.resolutionTitle}>
              {resolutionHeadline(action)}
            </Text>
          </View>
          {!!action.resolution_comment && (
            <Text style={styles.resolutionComment} numberOfLines={2}>
              {action.resolution_comment}
            </Text>
          )}
          {resolutionBadges(action).length > 0 && (
            <Text style={styles.resolutionMeta}>
              {resolutionBadges(action).join(' · ')}
            </Text>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        {!!action.due_date && (
          <View style={styles.dueDate}>
            <Calendar size={14} color={overdue ? '#DC2626' : '#6B7280'} />
            <Text style={[styles.dueDateText, overdue && { color: '#DC2626' }]}>
              {new Date(action.due_date).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
        <View style={styles.footerActions}>
          {onGeneratePlan && (
            <TouchableOpacity
              style={styles.planButton}
              testID={`action-plan-${action.id}`}
              onPress={() => onGeneratePlan(action)}
            >
              <Sparkles size={13} color="#7C3AED" />
              <Text style={styles.planButtonText}>Plan</Text>
            </TouchableOpacity>
          )}
          {action.status !== 'done' && action.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.advanceButton}
              testID={`action-advance-${action.id}`}
              onPress={() => onAdvance(action)}
            >
              <Text style={styles.advanceButtonText}>
                {action.status === 'open' ? 'Démarrer' : 'Résoudre'}
              </Text>
              <ChevronRight size={14} color="#2563EB" />
            </TouchableOpacity>
          )}
          {action.status === 'done' && (
            <CheckCircle size={18} color="#10B981" />
          )}
        </View>
      </View>
    </View>
  );
}

function hasResolutionEvidence(action: CorrectiveAction): boolean {
  const hasTextEvidence = [action.resolution_comment, action.resolved_by_name]
    .filter((value): value is string => typeof value === 'string')
    .some((value) => value.trim().length > 0);

  return (
    hasTextEvidence ||
    Boolean(action.resolution_photo_confirmed) ||
    Boolean(action.manager_validated)
  );
}

function resolutionHeadline(action: CorrectiveAction): string {
  const date = action.resolved_at
    ? new Date(action.resolved_at).toLocaleDateString('fr-FR')
    : null;
  const base = date ? `Résolue le ${date}` : 'Résolue';
  if (!action.resolved_by_name) return base;
  const matricule = action.resolved_by_matricule
    ? ` (${action.resolved_by_matricule})`
    : '';
  return `${base} par ${action.resolved_by_name}${matricule}`;
}

function resolutionBadges(action: CorrectiveAction): string[] {
  return [
    action.resolution_photo_confirmed ? 'Preuve photo' : null,
    action.manager_validated ? 'Validation manager' : null,
  ].filter((item): item is string => item !== null);
}

function getRequirementLabels(plan: ReturnType<typeof buildLocalActionPlan>) {
  return [
    plan.photoRequired ? 'Preuve photo' : null,
    plan.commentRequired ? 'Commentaire' : null,
    plan.employeeNameRequired ? 'Nom exécutant' : null,
    plan.employeeIdRequired ? 'Matricule' : null,
    plan.managerValidationRequired ? 'Validation manager' : null,
    plan.escalationRequired ? 'Escalade' : null,
  ].filter((item): item is string => item !== null);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardOverdue: {
    borderColor: '#FECACA',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  executionPanel: {
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  executionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  executionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  executionDeadline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  executionRequirements: {
    marginTop: 3,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  resolutionPanel: {
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resolutionTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  resolutionComment: {
    marginTop: 4,
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  resolutionMeta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  planButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  advanceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
});
