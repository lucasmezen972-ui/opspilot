import { useRouter } from 'expo-router';
import {
  User,
  Settings,
  Award,
  ChartBar as BarChart3,
  Bell,
  CircleHelp as HelpCircle,
  LogOut,
  Shield,
  Smartphone,
  Globe,
  Star,
  Target,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Responsable Magasin',
  employé: 'Employé',
  employee: 'Employé',
  stagiaire: 'Stagiaire',
};

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const displayName = profile?.full_name || 'Utilisateur';
  const displayRole = profile?.role
    ? roleLabels[profile.role] || profile.role
    : 'Employé';
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpForNextLevel = level * 100;
  const xpProgress =
    xpForNextLevel > 0 ? Math.min((xp / xpForNextLevel) * 100, 100) : 0;

  const statistics = useMemo(
    () => [
      {
        label: 'Audits réalisés',
        value: String(profile?.total_audits || 0),
        icon: BarChart3,
        color: '#2563EB',
      },
      {
        label: 'Score moyen',
        value: `${profile?.avg_score || 0}%`,
        icon: Target,
        color: '#10B981',
      },
      {
        label: 'Formations',
        value: String(profile?.completed_trainings || 0),
        icon: Award,
        color: '#F59E0B',
      },
      {
        label: 'Temps actif',
        value: `${profile?.active_time_hours || 0}h`,
        icon: Clock,
        color: '#8B5CF6',
      },
    ],
    [profile],
  );

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => signOut() },
    ]);
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
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileRole}>{displayRole}</Text>
            <Text style={styles.profileLocation}>{profile?.email || ''}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Star size={16} color="#F59E0B" />
            <Text style={styles.levelText}>Niveau {level}</Text>
          </View>
        </View>

        {/* Experience Bar */}
        <View style={styles.experienceSection}>
          <View style={styles.experienceHeader}>
            <Text style={styles.experienceTitle}>Progression</Text>
            <Text style={styles.experiencePoints}>
              {xp}/{xpForNextLevel} XP
            </Text>
          </View>
          <View style={styles.experienceBar}>
            <View
              style={[styles.experienceFill, { width: `${xpProgress}%` }]}
            />
          </View>
          <Text style={styles.experienceSubtext}>
            {xpForNextLevel - xp > 0
              ? `Plus que ${xpForNextLevel - xp} XP pour atteindre le niveau ${level + 1} !`
              : 'Niveau maximum atteint !'}
          </Text>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos statistiques</Text>
          <View style={styles.statisticsGrid}>
            {statistics.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <View key={index} style={styles.statisticCard}>
                  <View
                    style={[
                      styles.statisticIcon,
                      { backgroundColor: `${stat.color}20` },
                    ]}
                  >
                    <IconComponent size={20} color={stat.color} />
                  </View>
                  <Text style={styles.statisticValue}>{stat.value}</Text>
                  <Text style={styles.statisticLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.settingsMenu}>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() =>
                Alert.alert(
                  'Notifications',
                  'Les notifications push seront disponibles prochainement.',
                )
              }
            >
              <Bell size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Notifications</Text>
              <ChevronRight
                size={16}
                color="#D1D5DB"
                style={styles.settingsChevron}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => router.push('/legal/confidentialite')}
            >
              <Shield size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Confidentialité</Text>
              <ChevronRight
                size={16}
                color="#D1D5DB"
                style={styles.settingsChevron}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => router.push('/legal/mentions-legales')}
            >
              <Shield size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Mentions légales</Text>
              <ChevronRight
                size={16}
                color="#D1D5DB"
                style={styles.settingsChevron}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => router.push('/legal/cgu')}
            >
              <Shield size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>
                Conditions d’utilisation
              </Text>
              <ChevronRight
                size={16}
                color="#D1D5DB"
                style={styles.settingsChevron}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() =>
                Alert.alert(
                  'Appareil',
                  `Plateforme: ${Platform.OS}\nVersion: OpsPilot 1.0.0`,
                )
              }
            >
              <Smartphone size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Appareil</Text>
              <ChevronRight
                size={16}
                color="#D1D5DB"
                style={styles.settingsChevron}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() =>
                Alert.alert(
                  'Langue',
                  'Français est la seule langue disponible actuellement.',
                )
              }
            >
              <Globe size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Langue</Text>
              <ChevronRight
                size={16}
                color="#D1D5DB"
                style={styles.settingsChevron}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() =>
                Alert.alert(
                  'Support',
                  'Pour toute question, contactez support@opspilot.com',
                )
              }
            >
              <HelpCircle size={20} color="#6B7280" />
              <Text style={styles.settingsItemText}>Support</Text>
              <ChevronRight
                size={16}
                color="#D1D5DB"
                style={styles.settingsChevron}
              />
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
          <Text style={styles.appInfoSubtext}>
            © 2026 OpsPilot. Tous droits réservés.
          </Text>
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
    flex: 1,
  },
  settingsChevron: {
    marginLeft: 'auto',
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
