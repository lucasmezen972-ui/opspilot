import { type Href } from 'expo-router';
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
import { View, Text, StyleSheet } from 'react-native';

import { DashboardGrid } from './DashboardGrid';
import {
  AppActionRow,
  AppActionIndicator,
} from '../../shared/components/AppActionRow';
import { AppSectionHeader } from '../../shared/components/AppSectionHeader';
import { colors, radius, spacing } from '../../shared/styles/tokens';

interface QuickAction {
  icon: LucideIcon;
  title: string;
  sub: string;
  route: Href;
  roles?: string[];
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: BarChart3,
    title: 'Audits',
    sub: 'Contrôles terrain',
    route: '/audits',
  },
  {
    icon: Scan,
    title: 'Produits',
    sub: 'Stock et dates limites',
    route: '/products',
  },
  {
    icon: Wrench,
    title: 'Actions correctives',
    sub: 'Écarts et résolution',
    route: '/actions',
  },
  {
    icon: Target,
    title: 'Tâches',
    sub: 'Planning du jour',
    route: '/tasks',
  },
  {
    icon: FileText,
    title: 'Rapports',
    sub: 'Bilans et exports PDF',
    route: '/reports',
  },
  {
    icon: BookOpen,
    title: 'Formation',
    sub: 'Parcours et validations',
    route: '/training',
  },
  {
    icon: CreditCard,
    title: 'Facturation',
    sub: 'Offre et abonnement',
    route: '/billing',
    roles: ['admin', 'superadmin'],
  },
  {
    icon: Settings,
    title: 'Paramètres',
    sub: 'Profil et équipe',
    route: '/profile',
  },
];

interface DashboardQuickActionsProps {
  role: string;
  compact?: boolean;
  embedded?: boolean;
}

/** Section « Accès rapide » : raccourcis vers les modules, filtrés par rôle. */
export function DashboardQuickActions({
  role,
  compact = false,
  embedded = false,
}: DashboardQuickActionsProps) {
  const items = QUICK_ACTIONS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  const links = items.map((item) => {
    const Icon = item.icon;
    return (
      <AppActionRow
        key={item.title}
        style={[styles.card, compact && styles.compactCard]}
        href={item.route}
        accessibilityRole="link"
        accessibilityLabel={`${item.title}, ${item.sub}`}
      >
        <View style={[styles.iconWrap, compact && styles.compactIcon]}>
          <Icon size={compact ? 17 : 21} color={colors.primary} />
        </View>
        <Text style={[styles.title, compact && styles.compactLink]}>
          {item.title}
        </Text>
        {!compact && <Text style={styles.sub}>{item.sub}</Text>}
        {compact && <AppActionIndicator />}
      </AppActionRow>
    );
  });

  return (
    <View style={!embedded && styles.section}>
      {compact ? (
        <Text style={styles.compactTitle} accessibilityRole="header">
          Accès rapide
        </Text>
      ) : (
        <AppSectionHeader title="Accès rapide" />
      )}
      {compact ? (
        <View style={styles.compactList}>{links}</View>
      ) : (
        <DashboardGrid minItemWidth={180} columnOptions={[2, 3, 4]}>
          {links}
        </DashboardGrid>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.xl,
    paddingBottom: 0,
  },
  card: {
    flex: 1,
    minHeight: 144,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.controlBorder,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  compactTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.primaryInk,
    marginBottom: spacing.sm,
  },
  compactCard: {
    flex: 0,
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  compactList: { gap: 8 },
  compactIcon: {
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  compactLink: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.primaryDark,
  },
});
