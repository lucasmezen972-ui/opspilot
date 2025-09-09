import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Play, BookOpen, Award, Clock, CircleCheck as CheckCircle, Star, Users, Target, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useTraining } from '../../hooks/useTraining';

const courses = [
  {
    id: 1,
    title: 'Accueil client excellence',
    description: 'Apprenez les meilleures techniques d\'accueil et de service client',
    duration: '25 min',
    lessons: 5,
    progress: 80,
    status: 'in_progress',
    difficulty: 'Débutant',
    points: 50,
  },
  {
    id: 2,
    title: 'Hygiène et sécurité alimentaire',
    description: 'Formation obligatoire sur les normes HACCP et la sécurité alimentaire',
    duration: '45 min',
    lessons: 8,
    progress: 100,
    status: 'completed',
    difficulty: 'Intermédiaire',
    points: 100,
  },
  {
    id: 3,
    title: 'Gestion des stocks et inventaire',
    description: 'Maîtrisez les techniques de gestion des stocks et d\'inventaire',
    duration: '35 min',
    lessons: 6,
    progress: 0,
    status: 'not_started',
    difficulty: 'Avancé',
    points: 75,
  },
];

const achievements = [
  { id: 1, title: 'Premier cours terminé', icon: '🎓', unlocked: true },
  { id: 2, title: 'Semaine parfaite', icon: '⭐', unlocked: true },
  { id: 3, title: 'Expert formation', icon: '🏆', unlocked: false },
  { id: 4, title: 'Mentor', icon: '👨‍🏫', unlocked: false },
];

export default function TrainingScreen() {
  const { trainings, loading } = useTraining();

  const startCourse = (courseTitle: string) => {
    Alert.alert(
      'Formation',
      `Démarrer la formation "${courseTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Commencer', 
          onPress: () => Alert.alert('Formation', 'Fonctionnalité en développement.')
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'not_started': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'not_started': return 'Pas commencé';
      default: return 'Inconnu';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Débutant': return '#10B981';
      case 'Intermédiaire': return '#F59E0B';
      case 'Avancé': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Formation</Text>
        <View style={styles.pointsBadge}>
          <Star size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>425 XP</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Progress Overview */}
        <View style={styles.progressOverview}>
          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <BookOpen size={20} color="#2563EB" />
              <Text style={styles.progressStatNumber}>12</Text>
              <Text style={styles.progressStatLabel}>Cours terminés</Text>
            </View>
            <View style={styles.progressStatItem}>
              <Clock size={20} color="#F59E0B" />
              <Text style={styles.progressStatNumber}>8h 30m</Text>
              <Text style={styles.progressStatLabel}>Temps d'étude</Text>
            </View>
            <View style={styles.progressStatItem}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.progressStatNumber}>87%</Text>
              <Text style={styles.progressStatLabel}>Score moyen</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={[
                styles.achievementCard,
                !achievement.unlocked && styles.achievementCardLocked
              ]}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.achievementTitleLocked
                ]}>{achievement.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formations disponibles</Text>
          {courses.map((course) => (
            <TouchableOpacity key={course.id} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.courseTitleSection}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseDescription}>{course.description}</Text>
                </View>
                <View style={styles.coursePoints}>
                  <Star size={14} color="#F59E0B" />
                  <Text style={styles.coursePointsText}>{course.points}</Text>
                </View>
              </View>

              <View style={styles.courseMeta}>
                <View style={styles.courseMetaItem}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.courseMetaText}>{course.duration}</Text>
                </View>
                <View style={styles.courseMetaItem}>
                  <BookOpen size={14} color="#6B7280" />
                  <Text style={styles.courseMetaText}>{course.lessons} leçons</Text>
                </View>
                <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(course.difficulty)}20` }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(course.difficulty) }]}>
                    {course.difficulty}
                  </Text>
                </View>
              </View>

              {course.progress > 0 && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{course.progress}% terminé</Text>
                </View>
              )}

              <View style={styles.courseActions}>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(course.status)}20` }]}>
                  {course.status === 'completed' ? (
                    <CheckCircle size={12} color={getStatusColor(course.status)} />
                  ) : course.status === 'in_progress' ? (
                    <Play size={12} color={getStatusColor(course.status)} />
                  ) : (
                    <BookOpen size={12} color={getStatusColor(course.status)} />
                  )}
                  <Text style={[styles.statusText, { color: getStatusColor(course.status) }]}>
                    {getStatusText(course.status)}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => startCourse(course.title)}
                >
                  <Play size={16} color="#2563EB" />
                  <Text style={styles.actionButtonText}>
                    {course.status === 'not_started' ? 'Commencer' : 
                     course.status === 'in_progress' ? 'Continuer' : 'Revoir'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classement de l'équipe</Text>
          <View style={styles.leaderboard}>
            <View style={styles.leaderboardItem}>
              <View style={styles.leaderboardRank}>
                <Text style={styles.leaderboardRankText}>1</Text>
              </View>
              <Text style={styles.leaderboardName}>Marie Dupont (Vous)</Text>
              <Text style={styles.leaderboardPoints}>425 XP</Text>
            </View>
            <View style={styles.leaderboardItem}>
              <View style={styles.leaderboardRank}>
                <Text style={styles.leaderboardRankText}>2</Text>
              </View>
              <Text style={styles.leaderboardName}>Pierre Martin</Text>
              <Text style={styles.leaderboardPoints}>398 XP</Text>
            </View>
            <View style={styles.leaderboardItem}>
              <View style={styles.leaderboardRank}>
                <Text style={styles.leaderboardRankText}>3</Text>
              </View>
              <Text style={styles.leaderboardName}>Jean Leroy</Text>
              <Text style={styles.leaderboardPoints}>356 XP</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  progressOverview: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  achievementsList: {
    flexDirection: 'row',
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#9CA3AF',
  },
  courseCard: {
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
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courseTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  coursePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coursePointsText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  courseActions: {
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  leaderboard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leaderboardRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderboardRankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  leaderboardPoints: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});