import { Mail, X } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { getRoleColor, getRoleLabel } from './teamModel';
import type { Invitation } from '../../lib/supabase';
import { shadow } from '../../shared/styles/tokens';

interface InvitationCardProps {
  invitation: Invitation;
  onRevoke: (id: string, email: string) => void;
}

/** Carte d'une invitation en attente : e-mail, rôle, état, révocation. */
export function InvitationCard({ invitation, onRevoke }: InvitationCardProps) {
  const roleColor = getRoleColor(invitation.role);
  const expired =
    Boolean(invitation.expires_at) &&
    new Date(invitation.expires_at) < new Date();

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Mail size={18} color="#6B7280" />
        <View style={styles.info}>
          <Text style={styles.email}>{invitation.email}</Text>
          <View style={styles.meta}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
              <Text style={[styles.roleText, { color: roleColor.text }]}>
                {getRoleLabel(invitation.role)}
              </Text>
            </View>
            {expired && <Text style={styles.expiredBadge}>Expirée</Text>}
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onRevoke(invitation.id, invitation.email)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    ...shadow.card,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  info: { flex: 1 },
  email: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
  expiredBadge: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
