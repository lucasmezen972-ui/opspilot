import { Link, usePathname, useRouter, type Href } from 'expo-router';
import {
  Home,
  ClipboardCheck,
  SquareCheck,
  GraduationCap,
  LayoutGrid,
  Package,
  Wrench,
  FileText,
  MessageCircle,
  Users,
  LayoutDashboard,
  CreditCard,
  UserRound,
  Building2,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ComponentType, type KeyboardEvent } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type PressableProps,
} from 'react-native';

import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuth } from '../../hooks/useAuth';
import { can } from '../../utils/permissions';
import { isManagerRole } from '../../utils/roles';
import { colors } from '../styles/tokens';

const KeyboardPressable = Pressable as ComponentType<
  PressableProps & { onKeyDown: (event: KeyboardEvent<HTMLElement>) => void }
>;

type Destination = { label: string; path: string; icon: LucideIcon };
const primary: Destination[] = [
  { label: 'Accueil', path: '/', icon: Home },
  { label: 'Audits', path: '/audits', icon: ClipboardCheck },
  { label: 'Tâches', path: '/tasks', icon: SquareCheck },
  { label: 'Formation', path: '/training', icon: GraduationCap },
  { label: 'Plus', path: '/more', icon: LayoutGrid },
];

/** Desktop keeps the same routes and authorization as the mobile module hub. */
export function AppDesktopNavigation() {
  const pathname = usePathname();
  const [pressedPath, setPressedPath] = useState<string | null>(null);
  const router = useRouter();
  const { profile, isDemoMode, session } = useAuth();
  const { isEnabled } = useAppSettings();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const tools: Destination[] = [
    { label: 'Produits', path: '/products', icon: Package },
    { label: 'Actions correctives', path: '/actions', icon: Wrench },
    { label: 'Communication', path: '/chat', icon: MessageCircle },
  ];
  if (isEnabled('features.reports'))
    tools.push({ label: 'Rapports', path: '/reports', icon: FileText });
  if (isManagerRole(profile?.role))
    tools.push(
      { label: 'Équipe', path: '/team', icon: Users },
      { label: 'Cockpit manager', path: '/manager', icon: LayoutDashboard },
    );
  if (isAdmin)
    tools.push({ label: 'Abonnement', path: '/billing', icon: CreditCard });
  if ((isDemoMode && !session) || can(profile?.role, 'backoffice.access'))
    tools.push({
      label: 'Pilotage clients',
      path: '/backoffice',
      icon: Building2,
    });
  return (
    <View testID="desktop-navigation" style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Text style={styles.markText}>OP</Text>
        </View>
        <View>
          <Text style={styles.brandName}>OpsPilot</Text>
          <Text style={styles.brandDetail}>Opérations terrain</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.navContent}
      >
        <Text style={styles.section}>MON ESPACE</Text>
        <View
          accessibilityRole="tablist"
          accessibilityLabel="Navigation principale"
          aria-orientation="vertical"
          style={styles.group}
        >
          {primary.map(({ label, path, icon: Icon }, index) => {
            const active = pathname === path;
            return (
              <KeyboardPressable
                key={path}
                tabIndex={
                  active ||
                  (!primary.some((item) => item.path === pathname) &&
                    index === 0)
                    ? 0
                    : -1
                }
                onKeyDown={(event) => {
                  if (event.key === ' ') {
                    event.preventDefault();
                    if (!event.repeat) router.navigate(path as Href);
                    return;
                  }
                  const next =
                    event.key === 'ArrowDown'
                      ? (index + 1) % primary.length
                      : event.key === 'ArrowUp'
                        ? (index + primary.length - 1) % primary.length
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? primary.length - 1
                            : null;
                  if (next !== null) {
                    event.preventDefault();
                    event.currentTarget.parentElement
                      ?.querySelectorAll<HTMLElement>('[role="tab"]')
                      [next]?.focus();
                  }
                }}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                aria-selected={active}
                onPress={() => router.navigate(path as Href)}
                style={({ pressed }) => [
                  styles.item,
                  active && styles.active,
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  size={19}
                  color={active ? '#FFFFFF' : '#CBD5E1'}
                  accessible={false}
                />
                <Text style={[styles.label, active && styles.labelActive]}>
                  {label}
                </Text>
              </KeyboardPressable>
            );
          })}
        </View>
        <Text style={[styles.section, styles.toolsTitle]}>
          OUTILS DE L’ÉQUIPE
        </Text>
        <View style={styles.group}>
          {tools.map(({ label, path, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link key={path} href={path as Href} asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={label}
                  aria-current={active ? 'page' : undefined}
                  onPressIn={() => setPressedPath(path)}
                  onPressOut={() => setPressedPath(null)}
                  style={StyleSheet.flatten([
                    styles.item,
                    active && styles.toolActive,
                    pressedPath === path && styles.pressed,
                  ])}
                >
                  <Icon
                    size={18}
                    color={active ? '#FFFFFF' : '#CBD5E1'}
                    accessible={false}
                  />
                  <Text style={[styles.label, active && styles.labelActive]}>
                    {label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </ScrollView>
      <Link href="/profile" asChild>
        <Pressable
          accessibilityLabel="Profil et réglages"
          onPressIn={() => setPressedPath('profile')}
          onPressOut={() => setPressedPath(null)}
          style={StyleSheet.flatten([
            styles.profile,
            pressedPath === 'profile' && styles.pressed,
          ])}
        >
          <View style={styles.avatar}>
            <UserRound size={18} color="#E2E8F0" accessible={false} />
          </View>
          <View style={styles.profileBody}>
            <Text numberOfLines={1} style={styles.profileName}>
              {profile?.full_name ?? 'Mon compte'}
            </Text>
            <Text style={styles.profileDetail}>Profil et réglages</Text>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}
const styles = StyleSheet.create({
  sidebar: {
    width: 228,
    backgroundColor: '#0F172A',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
  },
  brand: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  brandName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandDetail: { color: '#CBD5E1', fontSize: 12, marginTop: 3 },
  scroll: { flex: 1 },
  navContent: { padding: 12, paddingTop: 8, paddingBottom: 24 },
  section: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  toolsTitle: { marginTop: 28 },
  group: { gap: 4 },
  item: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  active: { backgroundColor: colors.primary },
  toolActive: { backgroundColor: '#1E3A5F' },
  pressed: { backgroundColor: '#334155' },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
    lineHeight: 20,
  },
  labelActive: { color: '#FFFFFF', fontWeight: '600' },
  profile: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 76,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBody: { flex: 1, minWidth: 0 },
  profileName: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  profileDetail: { color: '#CBD5E1', fontSize: 12, marginTop: 4 },
});
