import { Crown, Shield, User, Clock } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

import { getRoleColor, getRoleLabel, formatLastActive } from './teamModel';
import type { Profile } from '../../lib/supabase';
import { colors, shadow } from '../../shared/styles/tokens';

function RoleIcon({ role }: { role: string }) {
  if (role === 'admin') return <Crown size={14} color="#DC2626" />;
  if (role === 'manager') return <Shield size={14} color="#7C3AED" />;
  return <User size={14} color="#2563EB" />;
}

interface MemberCardProps {
  member: Profile;
  isMe: boolean;
  showXP: boolean;
}

/** Carte d'un membre de l'équipe : avatar, identité, rôle, activité, XP. */
export function MemberCard({ member, isMe, showXP }: MemberCardProps) {
  const roleColor = getRoleColor(member.role);
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {member.full_name || member.email}
            {isMe ? '  (moi)' : ''}
          </Text>
        </View>
        <Text style={styles.email}>{member.email}</Text>
        <View style={styles.meta}>
          <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
            <RoleIcon role={member.role} />
            <Text style={[styles.roleText, { color: roleColor.text }]}>
              {getRoleLabel(member.role)}
            </Text>
          </View>
          <View style={styles.lastActive}>
            <Clock size={11} color="#9CA3AF" />
            <Text style={styles.lastActiveText}>
              {formatLastActive(member.last_active)}
            </Text>
          </View>
        </View>
      </View>
      {showXP && (
        <View style={styles.xp}>
          <Text style={styles.xpText}>{member.xp ?? 0} XP</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  email: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
    marginBottom: 6,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: { fontSize: 11, fontWeight: '600' },
  lastActive: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  lastActiveText: { fontSize: 11, color: '#9CA3AF' },
  xp: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: { fontSize: 12, fontWeight: '600', color: '#374151' },
});
