import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { User, Settings, Award, ChartBar as BarChart3, Bell, CircleHelp as HelpCircle, LogOut, Shield, Smartphone, Globe, Star, Trophy, Target, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

const achievements = [
  { id: 1, title: 'Premier audit', description: 'Terminé votre premier audit', icon: '🎯', date: '15 Jan 2024' },
  { id: 2, title: 'Semaine parfaite', description: '7 jours sans erreur', icon: '⭐', date: '10 Jan 2024' },
  { id: 3, title: 'Formateur expert', description: '5 formations terminées', icon: '🎓', date: '05 Jan 2024' },
  { id: 4, title: 'Scanner pro', description: '100 produits scannés', icon: '📱', date: '03 Jan 2024' },
];

const statistics = [
  { label: 'Audits réalisés', value: '47', icon: BarChart3, color: '#2563EB' },
  { label: 'Score moyen', value: '92%', icon: Target, color: '#10B981' },
  { label: 'Formations', value: '12', icon: Award, color: '#F59E0B' },
  { label: 'Temps actif', value: '156h', icon: Clock, color: '#8B5CF6' },
];

export default function ProfileScreen() {
  const { signOut, profile } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  const handleSettingsAction = (action: string) => {
    Alert.alert(
      action,
      'Cette fonctionnalité sera disponible dans une future version.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Settings size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <User size={32} color="#2563EB" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.email?.split('@')[0] || 'Utilisateur'}</Text>
            <Text style={styles.profileRole}>Responsable Magasin</Text>
            <Text style={styles.profileLocation}>Supermarché Central - Paris 15ème</Text>
          </View>
          <View style={styles.levelBadge}>
            <Star size={16} color="#F59E0B" />
            <Text style={styles.levelText}>Niveau 4</Text>
          </View>
        </View>

        {/* Experience Bar */}
        <View style={styles.experienceSection}>
          <View style={styles.experienceHeader}>
            <Text style={styles.experienceTitle}>Progression</Text>
            <Text style={styles.experiencePoints}>850/1000 XP</Text>
          </View>
          <View style={styles.experienceBar}>
            <View style={[styles.experienceFill, { width: '85%' }]} />
          </View>
          <Text style={styles.experienceSubtext}>Plus que 150 XP pour atteindre le niveau Expert !</Text>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos statistiques</Text>
          <View style={styles.statisticsGrid}>
            {statistics.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <View key={index} style={styles.statisticCard}>
                  <View style={[styles.statisticIcon, { backgroundColor: `${stat.color}20` }]}>
                    <IconComponent size={20} color={stat.color} />
                  </View>
                  <Text style={styles.statisticValue}>{stat.value}</Text>
                  <Text style={styles.statisticLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges récents</Text>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>{achievement.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.settingsMenu}>
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => handleSettingsAction('Notifications')}
            >
              <Bell size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => handleSettingsAction('Confidentialité')}
            >
              <Shield size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Confidentialité</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => handleSettingsAction('Appareil')}
            >
              <Smartphone size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Appareil</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => handleSettingsAction('Langue')}
            >
              <Globe size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Langue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => handleSettingsAction('Support')}
            >
              <HelpCircle size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>OpsPilot v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>© 2024 OpsPilot. Tous droits réservés.</Text>
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginBottom: 2,
  },
  profileLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  experienceSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  experiencePoints: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  experienceBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  experienceFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  experienceSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statisticCard: {
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
  statisticIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statisticValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statisticLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  settingsMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 10,
    color: '#D1D5DB',
  },
});