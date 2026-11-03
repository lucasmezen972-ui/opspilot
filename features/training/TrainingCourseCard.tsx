import {
  Play,
  BookOpen,
  Clock,
  CircleCheck as CheckCircle,
  Star,
  Sparkles,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { programRequirementLabel } from './internalPrograms';
import {
  getTrainingStatusColor,
  getTrainingStatusText,
  getDifficultyColor,
  getDifficultyText,
  getCourseActionLabel,
  type TrainingCourseView,
} from './trainingModel';
import { colors, radius, shadow } from '../../shared/styles/tokens';

interface TrainingCourseCardProps {
  course: TrainingCourseView;
  onOpen: (courseId: string) => void;
}

/** Carte d'un cours : titre, métadonnées, progression, statut et action. */
export function TrainingCourseCard({
  course,
  onOpen,
}: TrainingCourseCardProps) {
  const statusColor = getTrainingStatusColor(course.status);
  const difficultyColor = getDifficultyColor(course.difficulty);

  return (
    <View testID={`training-card-${course.id}`} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          {course.programRequirement && (
            <Text
              style={{
                fontSize: 12,
                lineHeight: 18,
                color: colors.primaryInk,
                fontWeight: '700',
                marginBottom: 6,
              }}
            >
              {programRequirementLabel(course.programRequirement)}
            </Text>
          )}
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {course.description}
          </Text>
        </View>
        <View style={styles.points}>
          <Star size={14} color="#F59E0B" />
          <Text style={styles.pointsText}>{course.xp_reward} XP</Text>
        </View>
        {course.ai_generated && (
          <View style={styles.aiBadge}>
            <Sparkles size={12} color="#8B5CF6" />
            <Text style={styles.aiText}>IA</Text>
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            Env. {course.duration_minutes} min
          </Text>
        </View>
        <View style={styles.metaItem}>
          <BookOpen size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            {course.chapterCount} chapitres · quiz final
            {course.videoCount
              ? ` · ${course.videoCount} vidéo${course.videoCount > 1 ? 's' : ''}`
              : ''}
          </Text>
        </View>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: `${difficultyColor}20` },
          ]}
        >
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>
            {getDifficultyText(course.difficulty)}
          </Text>
        </View>
      </View>

      {course.status !== 'needs_review' && course.progress > 0 && (
        <View style={styles.progressSection}>
          <View
            style={styles.progressBar}
            accessibilityRole="progressbar"
            accessibilityLabel={`Progression de ${course.title}`}
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.min(100, Math.max(0, course.progress)),
            }}
          >
            <View
              style={[styles.progressFill, { width: `${course.progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{course.progress}% terminé</Text>
        </View>
      )}

      <View style={styles.actions}>
        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
        >
          {course.status === 'completed' ? (
            <CheckCircle size={12} color={statusColor} />
          ) : course.status === 'in_progress' ? (
            <Play size={12} color={statusColor} />
          ) : (
            <BookOpen size={12} color={statusColor} />
          )}
          <Text
            testID={`training-status-${course.id}`}
            style={[styles.statusText, { color: statusColor }]}
          >
            {getTrainingStatusText(course.status)}
          </Text>
        </View>

        <TouchableOpacity
          testID={`training-open-${course.id}`}
          style={styles.actionButton}
          onPress={() => onOpen(course.id)}
          accessibilityRole="button"
          accessibilityLabel={`${getCourseActionLabel(course.status)} : ${course.title}`}
        >
          <Play size={16} color="#2563EB" />
          <Text style={styles.actionButtonText}>
            {getCourseActionLabel(course.status)}
          </Text>
        </TouchableOpacity>
      </View>
      {course.status === 'needs_review' && (
        <Text
          style={{
            fontSize: 13,
            lineHeight: 19,
            color: colors.warningText,
            marginTop: 10,
          }}
        >
          Ce résultat antérieur doit être réévalué côté serveur avant une
          nouvelle attestation.
        </Text>
      )}
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  points: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    color: colors.warningText,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  aiBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  aiText: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  metaItem: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
