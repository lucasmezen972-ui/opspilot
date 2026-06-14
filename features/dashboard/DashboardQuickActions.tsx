import { router, type Href } from 'expo-router';
import {
  type LucideIcon,
  Target,
  ChartBar as BarChart3,
  Scan,
  BookOpen,
  Wrench,
  CreditCard,
  Settings,
  FileText,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing, shadow } from '../../shared/styles/tokens';

interface QuickAction {
  icon: LucideIcon;
  color: string;
  title: string;
  sub: string;
  route: Href;
  roles?: string[];
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: BarChart3,
    color: '#2563EB',
    title: 'Audits',
    sub: 'Créer / gérer',
    route: '/audits',
  },
  {
    icon: Scan,
    color: '#059669',
    title: 'Produits',
    sub: 'Stock & DLC',
    route: '/products',
  },
  {
    icon: Wrench,
    color: '#7C3AED',
    title: 'Actions correctives',
    sub: 'Suivi des actions',
    route: '/actions',
  },
  {
    icon: Target,
    color: '#DC2626',
    title: 'Tâches',
    sub: 'Planning',
    route: '/tasks',
  },
  {
    icon: FileText,
    color: '#0891B2',
    title: 'Rapports',
    sub: 'Exporter PDF',
    route: '/reports',
  },
  {
    icon: BookOpen,
    color: '#D97706',
    title: 'Formation',
    sub: 'Classement & cours',
    route: '/training',
  },
  {
    icon: CreditCard,
    color: '#7C3AED',
    title: 'Facturation',
    sub: 'Abonnement',
    route: '/billing',
    roles: ['admin'],
  },
  {
    icon: Settings,
    color: '#6B7280',
    title: 'Paramètres',
    sub: 'Profil & équipe',
    route: '/profile',
  },
];

interface DashboardQuickActionsProps {
  role: string;
}

/** Section « Accès rapide » : raccourcis vers les modules, filtrés par rôle. */
export function DashboardQuickActions({ role }: DashboardQuickActionsProps) {
  const items = QUICK_ACTIONS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <View style={styles.section}>
      <AppSectionHeader title="Accès rapide" />
      <View style={styles.grid}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.title}
              style={styles.card}
              onPress={() => router.push(item.route)}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: `${item.color}18` },
                ]}
              >
                <Icon size={26} color={item.color} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub}>{item.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.xl,
    paddingBottom: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textStrong,
    textAlign: 'center',
  },
  sub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
