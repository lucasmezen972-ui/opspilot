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
} from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { useAuth } from '../../hooks/useAuth';

export default function TabLayout() {
  const { profile } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveBackgroundColor: '#EEF2FF',
      }}
    >
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
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ size, color }) => (
            <Package size={size} color={color} />
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
        name="actions"
        options={{
          title: 'Actions',
          tabBarIcon: ({ size, color }) => <Wrench size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          tabBarIcon: ({ size, color }) => (
            <FileText size={size} color={color} />
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
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Équipe',
          tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
          href:
            profile?.role === 'manager' || profile?.role === 'admin'
              ? '/team'
              : null,
        }}
      />
      <Tabs.Screen
        name="manager"
        options={{
          title: 'Manager',
          tabBarIcon: ({ size, color }) => (
            <LayoutDashboard size={size} color={color} />
          ),
          href:
            profile?.role === 'manager' || profile?.role === 'admin'
              ? '/manager'
              : null,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Abonnement',
          tabBarIcon: ({ size, color }) => (
            <CreditCard size={size} color={color} />
          ),
          href: profile?.role === 'admin' ? '/billing' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingBottom: 8,
    height: 72,
  },
  tabBarItem: {
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
