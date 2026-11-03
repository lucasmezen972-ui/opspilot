import Constants from 'expo-constants';
import { type Href } from 'expo-router';
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
  Rocket,
  type LucideIcon,
} from 'lucide-react-native';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';

import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuth } from '../../hooks/useAuth';
import {
  AppActionRow,
  AppActionIndicator,
} from '../../shared/components/AppActionRow';
import { colors, typography } from '../../shared/styles/tokens';
import { can } from '../../utils/permissions';
import { isManagerRole } from '../../utils/roles';

type HubLink = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: Href;
  section: 'terrain' | 'pilotage' | 'compte';
};

/** Hub « Plus » : accès à tous les modules secondaires depuis une vue épurée. */
export default function MoreScreen() {
  const { width } = useWindowDimensions();
  const availableWidth =
    width - (Platform.OS === 'web' && width >= 1024 ? 228 : 0);
  const columns = availableWidth >= 820 ? 2 : 1;
  const { profile, isDemoMode, session } = useAuth();
  const { isEnabled } = useAppSettings();
  const isManager = isManagerRole(profile?.role);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
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
      section: 'terrain',
    },
    {
      slug: 'actions',
      label: 'Actions à sécuriser',
      description: 'Plans correctifs, preuves & suivi',
      icon: Wrench,
      href: '/actions',
      section: 'terrain',
    },
    {
      slug: 'chat',
      label: 'Communication',
      description: 'Messages officiels & canaux terrain',
      icon: MessageCircle,
      href: '/chat',
      section: 'terrain',
    },
  ];

  if (isEnabled('features.reports')) {
    links.push({
      slug: 'reports',
      label: 'Rapports',
      description: 'Preuves, conformité & exports direction',
      icon: FileText,
      href: '/reports',
      section: 'pilotage',
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
        section: 'pilotage',
      },
      {
        slug: 'team',
        label: 'Équipe',
        description: 'Membres, rôles & supervision',
        icon: Users,
        href: '/team',
        section: 'pilotage',
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
      section: 'compte',
    });
  }
  if (isAdmin || canBackoffice) {
    links.push({
      slug: 'commercial',
      label: 'Présenter OpsPilot',
      description: 'Démo, offres & conversion client',
      icon: Rocket,
      href: '/commercial',
      section: 'pilotage',
    });
  }
  if (canBackoffice) {
    links.push({
      slug: 'backoffice',
      label: 'Pilotage clients',
      description: 'Santé des organisations & support',
      icon: Building2,
      href: '/backoffice',
      section: 'pilotage',
    });
  }
  links.push({
    slug: 'profile',
    label: 'Profil & réglages',
    description: 'Compte, sécurité & préférences',
    icon: User,
    href: '/profile',
    section: 'compte',
  });

  const sections = [
    {
      key: 'terrain',
      title: 'Sur le terrain',
      description: 'Les outils du quotidien, à portée de main.',
    },
    {
      key: 'pilotage',
      title: 'Piloter l’activité',
      description: 'Une vue d’ensemble pour accompagner vos équipes.',
    },
    {
      key: 'compte',
      title: 'Compte et préférences',
      description: 'Vos accès et les paramètres de votre espace.',
    },
  ] as const;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>VOTRE ESPACE DE TRAVAIL</Text>
            <Text style={styles.title} testID="page-more-title">
              Tous les outils
            </Text>
            <Text style={styles.subtitle}>
              Le terrain, l’équipe et les réglages de votre espace.
            </Text>
          </View>
          <View style={styles.moduleCount}>
            <Text style={styles.moduleCountText}>{links.length} outils</Text>
          </View>
        </View>

        <View style={styles.sections}>
          {sections.map((section) => {
            const items = links.filter((link) => link.section === section.key);
            if (!items.length) return null;
            return (
              <View key={section.key} style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionDescription}>
                    {section.description}
                  </Text>
                </View>
                <View style={styles.list}>
                  {items.map((link) => (
                    <AppActionRow
                      key={link.slug}
                      testID={`more-link-${link.slug}`}
                      accessibilityRole="button"
                      accessibilityLabel={link.label}
                      style={[
                        styles.row,
                        { flexBasis: columns === 2 ? '45%' : '100%' },
                      ]}
                      href={link.href}
                    >
                      <View style={styles.iconWrap}>
                        <link.icon
                          size={20}
                          color={colors.primaryDark}
                          strokeWidth={1.8}
                        />
                      </View>
                      <View style={styles.rowBody}>
                        <Text style={styles.rowLabel}>{link.label}</Text>
                        <Text style={styles.rowDesc}>{link.description}</Text>
                      </View>
                      <AppActionIndicator />
                    </AppActionRow>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 44, paddingHorizontal: 20 },
  inner: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  header: {
    paddingTop:
      Platform.OS === 'web' ? 36 : (Constants.statusBarHeight ?? 44) + 18,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1.35,
    marginBottom: 9,
  },
  title: {
    fontSize: 31,
    lineHeight: 39,
    letterSpacing: -0.9,
    fontWeight: '700',
    color: colors.textStrong,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: 8,
    maxWidth: 520,
  },
  moduleCount: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#E9EEF7',
    marginTop: 25,
  },
  moduleCountText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.primaryInk,
  },
  sections: { gap: 28 },
  section: { gap: 12 },
  sectionHeading: { gap: 5, paddingHorizontal: 2 },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    color: colors.textStrong,
    letterSpacing: -0.2,
  },
  sectionDescription: { fontSize: 13, lineHeight: 20, color: colors.textMuted },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  row: {
    flexGrow: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 88,
  },
  iconWrap: {
    width: 39,
    height: 39,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5FD',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowLabel: {
    ...typography.body,
    fontWeight: '600',
    lineHeight: 22,
    color: colors.primaryDark,
    letterSpacing: -0.15,
  },
  rowDesc: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
    marginTop: 3,
  },
});
