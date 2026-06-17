import { useRouter, type Href } from 'expo-router';
import {
  Package,
  Wrench,
  FileText,
  MessageCircle,
  Users,
  LayoutDashboard,
  CreditCard,
  Building2,
  User,
  ChevronRight,
  Rocket,
  type LucideIcon,
} from 'lucide-react-native';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuth } from '../../hooks/useAuth';
import {
  colors,
  radius,
  spacing,
  shadow,
  typography,
} from '../../shared/styles/tokens';
import { can } from '../../utils/permissions';
import { isManagerRole } from '../../utils/roles';

type HubLink = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: Href;
  accent: string;
  accentSoft: string;
};

/** Hub « Plus » : accès à tous les modules secondaires depuis une vue épurée. */
export default function MoreScreen() {
  const router = useRouter();
  const { profile, isDemoMode, session } = useAuth();
  const { isEnabled } = useAppSettings();
  const isManager = isManagerRole(profile?.role);
  const isAdmin = profile?.role === 'admin';
  const isLocalDemo = isDemoMode && !session;
  // Back-office superadmin : visible pour les rôles habilités et en démo (vitrine).
  const canBackoffice = isLocalDemo || can(profile?.role, 'backoffice.access');

  const links: HubLink[] = [
    {
      slug: 'products',
      label: 'Produits',
      description: 'Catalogue, scan & dates sensibles',
      icon: Package,
      href: '/products',
      accent: colors.primary,
      accentSoft: colors.primarySoft,
    },
    {
      slug: 'actions',
      label: 'Actions à sécuriser',
      description: 'Plans correctifs, preuves & suivi',
      icon: Wrench,
      href: '/actions',
      accent: colors.warningText,
      accentSoft: colors.warningSoft,
    },
    {
      slug: 'chat',
      label: 'Communication',
      description: 'Messages officiels & canaux terrain',
      icon: MessageCircle,
      href: '/chat',
      accent: colors.primary,
      accentSoft: colors.primarySoft,
    },
  ];

  if (isEnabled('features.reports')) {
    links.push({
      slug: 'reports',
      label: 'Rapports',
      description: 'Preuves, conformité & exports direction',
      icon: FileText,
      href: '/reports',
      accent: colors.successText,
      accentSoft: colors.successSoft,
    });
  }
  if (isManager) {
    links.push(
      {
        slug: 'manager',
        label: 'Cockpit manager',
        description: 'Pilotage, risques & gouvernance',
        icon: LayoutDashboard,
        href: '/manager',
        accent: colors.dangerStrong,
        accentSoft: colors.dangerSoft,
      },
      {
        slug: 'team',
        label: 'Équipe',
        description: 'Membres, rôles & supervision',
        icon: Users,
        href: '/team',
        accent: colors.primary,
        accentSoft: colors.primarySoft,
      },
    );
  }
  if (isAdmin) {
    links.push({
      slug: 'billing',
      label: 'Abonnement',
      description: 'Plan, facturation & activation',
      icon: CreditCard,
      href: '/billing',
      accent: colors.textMuted,
      accentSoft: colors.backgroundAlt,
    });
  }
  if (isAdmin || canBackoffice) {
    links.push({
      slug: 'commercial',
      label: 'Présenter OpsPilot',
      description: 'Démo, offres & conversion client',
      icon: Rocket,
      href: '/commercial',
      accent: colors.primary,
      accentSoft: colors.primarySoft,
    });
  }
  if (canBackoffice) {
    links.push({
      slug: 'backoffice',
      label: 'Pilotage clients',
      description: 'Santé des organisations & support',
      icon: Building2,
      href: '/backoffice',
      accent: colors.primaryDark,
      accentSoft: colors.primarySoft,
    });
  }
  links.push({
    slug: 'profile',
    label: 'Profil & réglages',
    description: 'Compte, sécurité & préférences',
    icon: User,
    href: '/profile',
    accent: colors.textMuted,
    accentSoft: colors.backgroundAlt,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title} testID="page-more-title">
          Plus
        </Text>
        <Text style={styles.subtitle}>
          Modules terrain, preuves et pilotage au même endroit
        </Text>
      </View>

      <View style={styles.list}>
        {links.map((link) => (
          <TouchableOpacity
            key={link.slug}
            testID={`more-link-${link.slug}`}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => router.push(link.href)}
          >
            <View
              style={[styles.iconWrap, { backgroundColor: link.accentSoft }]}
            >
              <link.icon size={20} color={link.accent} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>{link.label}</Text>
              <Text style={styles.rowDesc}>{link.description}</Text>
            </View>
            <ChevronRight size={18} color={colors.textFaint} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.xl,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.4,
    fontWeight: '700',
    color: colors.textStrong,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  list: {
    margin: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textStrong,
  },
  rowDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});
