import { useRouter } from 'expo-router';
import {
  Settings,
  Bell,
  CircleHelp as HelpCircle,
  LogOut,
  Shield,
  Smartphone,
  Globe,
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

import { ExperienceBar } from '../../features/profile/ExperienceBar';
import {
  ProfileMenu,
  type ProfileMenuEntry,
} from '../../features/profile/ProfileMenu';
import { ProfileStats } from '../../features/profile/ProfileStats';
import { ProfileSummary } from '../../features/profile/ProfileSummary';
import {
  buildProfileStats,
  computeXpProgress,
  getProfileRoleLabel,
} from '../../features/profile/profileModel';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const displayName = profile?.full_name || 'Utilisateur';
  const displayRole = getProfileRoleLabel(profile?.role);
  const progress = computeXpProgress(profile?.level || 1, profile?.xp || 0);
  const stats = useMemo(() => buildProfileStats(profile), [profile]);

  const menuEntries: ProfileMenuEntry[] = [
    {
      icon: Bell,
      label: 'Notifications',
      onPress: () => router.push('/settings'),
    },
    {
      icon: Shield,
      label: 'Confidentialité',
      onPress: () => router.push('/legal/confidentialite'),
    },
    {
      icon: Shield,
      label: 'Mentions légales',
      onPress: () => router.push('/legal/mentions-legales'),
    },
    {
      icon: Shield,
      label: 'Conditions d’utilisation',
      onPress: () => router.push('/legal/cgu'),
    },
    {
      icon: Smartphone,
      label: 'Appareil',
      onPress: () =>
        Alert.alert(
          'Appareil',
          `Plateforme: ${Platform.OS}\nVersion: OpsPilot 1.0.0`,
        ),
    },
    {
      icon: Globe,
      label: 'Langue',
      onPress: () =>
        Alert.alert('Langue', 'OpsPilot est disponible en français.'),
    },
    {
      icon: HelpCircle,
      label: 'Support',
      onPress: () =>
        Alert.alert(
          'Support',
          'Pour toute question, contactez support@opspilot.com',
        ),
    },
  ];

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} testID="page-profile-title">
          Profil
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/settings')}
          testID="profile-settings-button"
          accessibilityLabel="Ouvrir les réglages"
        >
          <Settings size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <ProfileSummary
          name={displayName}
          role={displayRole}
          email={profile?.email || ''}
          level={progress.level}
        />

        <ExperienceBar progress={progress} />

        <ProfileStats stats={stats} />

        <ProfileMenu entries={menuEntries} />

        <View style={styles.section}>
          <TouchableOpacity
            testID="logout-button"
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

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
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
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
