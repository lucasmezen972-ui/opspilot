import { Tabs } from 'expo-router';
import {
  Home,
  ClipboardCheck,
  SquareCheck as CheckSquare,
  GraduationCap,
  LayoutGrid,
  Rocket,
} from 'lucide-react-native';
import { StyleSheet, View, Platform, useWindowDimensions } from 'react-native';

import AnnouncementBanner from '../../components/AnnouncementBanner';
import { AppDesktopNavigation } from '../../shared/components/AppDesktopNavigation';
import { colors, shadow } from '../../shared/styles/tokens';

/**
 * Navigation principale épurée : 5 onglets essentiels en barre basse
 * (Accueil, Audits, Tâches, Formation, Plus). Les modules secondaires
 * (Produits, Actions, Rapports, Communication, Équipe, Cockpit, Abonnement,
 * Profil) restent routables et sont regroupés dans le hub « Plus ».
 */
export default function TabLayout() {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1024;
  return (
    <View style={styles.shell}>
      {Platform.OS === 'web' && (
        <a className="opspilot-skip-link" href="#opspilot-main">
          Aller au contenu
        </a>
      )}
      {desktop && <AppDesktopNavigation />}
      <View style={styles.workspace}>
        <View
          nativeID="opspilot-main"
          role="main"
          tabIndex={-1}
          style={styles.content}
        >
          <AnnouncementBanner />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: desktop ? styles.hiddenTabBar : styles.tabBar,
              tabBarLabelStyle: styles.tabBarLabel,
              tabBarItemStyle: styles.tabBarItem,
            }}
          >
            {/* ── Onglets principaux (barre basse) ── */}
            <Tabs.Screen
              name="index"
              options={{
                title: 'Accueil',
                tabBarIcon: ({ size, color }) => (
                  <Home size={size} color={color} />
                ),
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
            <Tabs.Screen
              name="chat"
              options={{ href: null, title: 'Messages' }}
            />
            <Tabs.Screen
              name="team"
              options={{ href: null, title: 'Équipe' }}
            />
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
                title: 'Présenter OpsPilot',
                tabBarIcon: ({ size, color }) => (
                  <Rocket size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="backoffice"
              options={{ href: null, title: 'Pilotage clients' }}
            />
            <Tabs.Screen
              name="profile"
              options={{ href: null, title: 'Profil' }}
            />
          </Tabs>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  workspace: { flex: 1, minWidth: 0 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    minWidth: 0,
  },
  hiddenTabBar: { display: 'none' },
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
    letterSpacing: 0,
  },
});
