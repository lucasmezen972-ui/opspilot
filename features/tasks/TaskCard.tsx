import {
  Clock,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Calendar,
  MapPin,
  Flag,
  User,
  Repeat,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import {
  getPriorityColor,
  getPriorityText,
  getTaskStatusColor,
  getTaskStatusText,
} from './taskModel';
import { isRecurring, recurrenceLabel } from './taskRecurrence';
import { executionProofSummary, isTaskValidated } from './taskTraceability';
import type { Task } from '../../lib/supabase';
import { colors, radius, shadow } from '../../shared/styles/tokens';

interface TaskCardProps {
  task: Task;
  currentUserId?: string;
  canValidate?: boolean;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onValidate?: (taskId: string) => void;
}

function statusIcon(status: string) {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'in_progress':
      return Clock;
    default:
      return AlertTriangle;
  }
}

/** Carte d'une tâche : priorité, statut, détails et actions de progression. */
export function TaskCard({
  task,
  currentUserId,
  canValidate = false,
  onStart,
  onComplete,
  onValidate,
}: TaskCardProps) {
  const StatusIcon = statusIcon(task.status);
  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getTaskStatusColor(task.status);
  const proof = executionProofSummary(task);
  const validated = isTaskValidated(task);

  return (
    <TouchableOpacity
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Voir les détails de la tâche ${task.title}`}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{task.title}</Text>
          <View style={styles.meta}>
            <View
              style={[
                styles.priority,
                { backgroundColor: `${priorityColor}20` },
              ]}
            >
              <Flag size={12} color={priorityColor} />
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                {getPriorityText(task.priority)}
              </Text>
            </View>
            <View
              style={[styles.status, { backgroundColor: `${statusColor}20` }]}
            >
              <StatusIcon size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getTaskStatusText(task.status)}
              </Text>
            </View>
            {isRecurring(task.recurrence) && (
              <View style={styles.recurrence}>
                <Repeat size={11} color="#7C3AED" />
                <Text style={styles.recurrenceText}>
                  {recurrenceLabel(task.recurrence)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.description}>{task.description}</Text>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <User size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {task.assigned_to === currentUserId ? 'Vous' : 'Autre utilisateur'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.detailText}>{task.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {task.due_date
              ? new Date(task.due_date).toLocaleDateString()
              : "Pas d'échéance"}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {task.estimated_time_minutes
              ? `${task.estimated_time_minutes} min`
              : 'Non estimé'}
          </Text>
        </View>
      </View>

      {task.status === 'completed' && proof !== '' && (
        <View style={styles.proof} testID={`task-proof-${task.id}`}>
          <Text style={styles.proofLabel}>Preuve d’exécution</Text>
          <Text style={styles.proofText}>{proof}</Text>
          {task.completion_comment ? (
            <Text style={styles.proofComment}>
              « {task.completion_comment} »
            </Text>
          ) : null}
          {validated ? (
            <View style={styles.validatedBadge}>
              <CheckCircle size={12} color={colors.successText} />
              <Text style={styles.validatedText}>
                Validé
                {task.validated_by_name ? ` · ${task.validated_by_name}` : ''}
              </Text>
            </View>
          ) : canValidate && onValidate ? (
            <TouchableOpacity
              testID={`task-validate-${task.id}`}
              style={styles.validateButton}
              onPress={() => onValidate(task.id)}
            >
              <Text style={styles.validateButtonText}>
                Valider la réalisation
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {task.status !== 'completed' && (
        <View style={styles.actions}>
          {task.status === 'pending' ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => onStart(task.id)}
              accessibilityRole="button"
              accessibilityLabel="Commencer la tâche"
            >
              <Text style={styles.startButtonText}>Commencer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => onComplete(task.id)}
              accessibilityRole="button"
              accessibilityLabel="Terminer la tâche"
            >
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Terminer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  header: {
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
  },
  recurrenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  priority: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
  },
  proof: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  proofLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  proofText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textStrong,
  },
  proofComment: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  validatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  validatedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.successText,
  },
  validateButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  validateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  startButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  startButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
