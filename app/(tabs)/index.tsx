import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAudits } from '../../hooks/useAudits';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../hooks/useNotifications';
import { TrendingUp, Users, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Award, Target, Calendar, ChartBar as BarChart3, Scan, MessageCircle, BookOpen } from 'lucide-react-native';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import NotificationCenter from '../../components/NotificationCenter';

export default function HomeScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { profile } = useAuth();
  const { audits } = useAudits();
  const { tasks } = useTasks();
  const { unreadCount } = useNotifications();

  const completedAuditsToday = audits.length;
  const completedTasksToday = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {profile?.full_name || profile?.email?.split('@')[0] || 'Utilisateur'} !</Text>
          <Text style={styles.subtitle}>Prêt pour une journée productive ?</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => setShowNotifications(true)}
        >
          <Bell size={24} color="#2563EB" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#10B981" />
          <Text style={styles.statNumber}>{profile?.avg_score || 0}%</Text>
          <Text style={styles.statLabel}>Score du jour</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>{completedTasksToday}/{completedTasksToday + pendingTasks}</Text>
          <Text style={styles.statLabel}>Tâches terminées</Text>
        </View>
        <View style={styles.statCard}>
          <AlertTriangle size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{pendingTasks}</Text>
          <Text style={styles.statLabel}>Actions requises</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/audits')}>
            <BarChart3 size={32} color="#2563EB" />
            <Text style={styles.actionTitle}>Nouvel audit</Text>
            <Text style={styles.actionSubtitle}>Lancer un contrôle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/products')}>
            <Scan size={32} color="#059669" />
            <Text style={styles.actionTitle}>Scanner produit</Text>
            <Text style={styles.actionSubtitle}>Vérification rapide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/profile')}>
            <Award size={32} color="#DC2626" />
            <Text style={styles.actionTitle}>Mes badges</Text>
            <Text style={styles.actionSubtitle}>Voir mes récompenses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/tasks')}>
            <Target size={32} color="#7C3AED" />
            <Text style={styles.actionTitle}>Mes tâches</Text>
            <Text style={styles.actionSubtitle}>Voir le planning</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activités récentes</Text>
        <View style={styles.activityList}>
          {audits.slice(0, 3).map((audit, index) => (
            <TouchableOpacity key={audit.id} style={styles.activityItem} onPress={() => router.push('/audits')}>
              <View style={[styles.activityIcon, { backgroundColor: audit.status === 'completed' ? '#DCFCE7' : '#FEF3C7' }]}>
                {audit.status === 'completed' ? (
                  <CheckCircle size={16} color="#16A34A" />
                ) : (
                  <AlertTriangle size={16} color="#D97706" />
                )}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{audit.title}</Text>
                <Text style={styles.activityTime}>
                  {audit.status === 'completed' ? 'Terminé' : 'En cours'} • {new Date(audit.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {audits.length === 0 && (
            <>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#DCFCE7' }]}>
                  <CheckCircle size={16} color="#16A34A" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Audit rayon frais terminé</Text>
                  <Text style={styles.activityTime}>Il y a 30 minutes</Text>
                </View>
              </View>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#FEF3C7' }]}>
                  <AlertTriangle size={16} color="#D97706" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>3 produits en rupture détectés</Text>
                  <Text style={styles.activityTime}>Il y a 1 heure</Text>
                </View>
              </View>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: '#DBEAFE' }]}>
                  <BookOpen size={16} color="#2563EB" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Formation "Accueil client" complétée</Text>
                  <Text style={styles.activityTime}>Il y a 2 heures</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Quick Stats Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé du jour</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <BarChart3 size={20} color="#2563EB" />
            <Text style={styles.summaryLabel}>Audits</Text>
            <Text style={styles.summaryValue}>{audits.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Target size={20} color="#10B981" />
            <Text style={styles.summaryLabel}>Tâches</Text>
            <Text style={styles.summaryValue}>{tasks.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <BookOpen size={20} color="#F59E0B" />
            <Text style={styles.summaryLabel}>Formations</Text>
            <Text style={styles.summaryValue}>3</Text>
          </View>
        </View>
      </View>

      {/* Team Leaderboard Teaser */}
      {profile && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Votre position</Text>
            <TouchableOpacity onPress={() => router.push('/training')}>
              <Text style={styles.sectionLink}>Voir classement</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.leaderboardTeaser}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#1</Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{profile.email}</Text>
              <Text style={styles.activityTime}>425 XP • Niveau 4</Text>
            </View>
            <TouchableOpacity style={styles.viewProfileButton} onPress={() => router.push('/profile')}>
              <Text style={styles.viewProfileText}>Voir profil</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom padding for scroll */}
      <View style={styles.bottomPadding} />

      {/* Gamification Panel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Votre progression</Text>
        <View style={styles.gamificationPanel}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>
              {profile?.level && profile.level >= 5 ? 'Expert Magasin' : 
               profile?.level && profile.level >= 3 ? 'Employé Confirmé' : 'Débutant'}
            </Text>
            <Text style={styles.levelSubtitle}>
              Niveau {profile?.level || 1} • {profile?.xp || 0}/1000 XP
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((profile?.xp || 0) % 1000) / 10}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Plus que {1000 - ((profile?.xp || 0) % 1000)} XP pour le niveau suivant !
          </Text>
        </View>
      </View>

      <NotificationCenter
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </ScrollView>
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
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  gamificationPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  levelInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  levelSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLink: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  leaderboardTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  viewProfileButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewProfileText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});