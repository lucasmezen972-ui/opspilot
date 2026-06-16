import { Tabs } from 'expo-router';
import {
  Chrome as Home,
  ClipboardCheck,
  Package,
  SquareCheck as CheckSquare,
  GraduationCap,
  MessageCircle,
  User,
  LayoutDashboard,
  Wrench,
  Users,
  CreditCard,
  FileText,
  LayoutGrid,
  Rocket,
} from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import AnnouncementBanner from '../../components/AnnouncementBanner';
import { colors, shadow } from '../../shared/styles/tokens';

/**
 * Navigation principale épurée : 5 onglets essentiels en barre basse
 * (Accueil, Audits, Tâches, Formation, Plus). Les modules secondaires
 * (Produits, Actions, Rapports, Communication, Équipe, Cockpit, Abonnement,
 * Profil) restent routables et sont regroupés dans le hub « Plus ».
 */
export default function TabLayout() {
  return (
    <>
      <AnnouncementBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        {/* ── Onglets principaux (barre basse) ── */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="audits"
          options={{
            title: 'Audits',
            tabBarIcon: ({ size, color }) => (
              <ClipboardCheck size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tâches',
            tabBarIcon: ({ size, color }) => (
              <CheckSquare size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="training"
          options={{
            title: 'Formation',
            tabBarIcon: ({ size, color }) => (
              <GraduationCap size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'Plus',
            tabBarIcon: ({ size, color }) => (
              <LayoutGrid size={size} color={color} />
            ),
          }}
        />

        {/* ── Modules secondaires : routables, hors barre (hub « Plus ») ── */}
        <Tabs.Screen
          name="products"
          options={{ href: null, title: 'Produits' }}
        />
        <Tabs.Screen
          name="actions"
          options={{ href: null, title: 'Actions' }}
        />
        <Tabs.Screen
          name="reports"
          options={{ href: null, title: 'Rapports' }}
        />
        <Tabs.Screen name="chat" options={{ href: null, title: 'Messages' }} />
        <Tabs.Screen name="team" options={{ href: null, title: 'Équipe' }} />
        <Tabs.Screen
          name="manager"
          options={{ href: null, title: 'Manager' }}
        />
        <Tabs.Screen
          name="billing"
          options={{ href: null, title: 'Abonnement' }}
        />
        <Tabs.Screen
          name="commercial"
          options={{
            href: null,
            title: 'Offre commerciale',
            tabBarIcon: ({ size, color }) => (
              <Rocket size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="backoffice"
          options={{ href: null, title: 'Back-office' }}
        />
        <Tabs.Screen name="profile" options={{ href: null, title: 'Profil' }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 76,
    paddingTop: 10,
    paddingBottom: 12,
    ...shadow.card,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
