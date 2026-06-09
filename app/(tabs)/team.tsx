import {
  Users,
  Mail,
  Plus,
  Crown,
  Shield,
  User,
  Clock,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { useInvitations } from '../../hooks/useInvitations';
import { useTeam } from '../../hooks/useTeam';
import type { Invitation } from '../../lib/supabase';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  employé: 'Employé',
  employee: 'Employé',
  stagiaire: 'Stagiaire',
};

const DEFAULT_ROLE_COLOR = { bg: '#DBEAFE', text: '#2563EB' };
const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin:    { bg: '#FEE2E2', text: '#DC2626' },
  manager:  { bg: '#EDE9FE', text: '#7C3AED' },
  employé:  { bg: '#DBEAFE', text: '#2563EB' },
  employee: { bg: '#DBEAFE', text: '#2563EB' },
  stagiaire:{ bg: '#FEF3C7', text: '#D97706' },
};

const INVITE_ROLES: Invitation['role'][] = ['manager', 'employé', 'stagiaire'];

function RoleIcon({ role }: { role: string }) {
  if (role === 'admin') return <Crown size={14} color="#DC2626" />;
  if (role === 'manager') return <Shield size={14} color="#7C3AED" />;
  return <User size={14} color="#2563EB" />;
}

export default function TeamScreen() {
  const { profile } = useAuth();
  const { members, loading: loadingMembers } = useTeam();
  const {
    invitations,
    loading: loadingInvitations,
    canManage,
    createInvitation,
    revokeInvitation,
  } = useInvitations();

  const [modalVisible, setModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Invitation['role']>('employé');
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteError(null);
    setSubmitting(true);
    const { error } = await createInvitation(inviteEmail, inviteRole);
    setSubmitting(false);
    if (error) {
      setInviteError(typeof error === 'string' ? error : 'Erreur lors de l\'invitation');
      return;
    }
    setModalVisible(false);
    setInviteEmail('');
    setInviteRole('employé');
  };

  const handleRevoke = (id: string, email: string) => {
    Alert.alert(
      'Révoquer l\'invitation',
      `Annuler l'invitation envoyée à ${email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: () => revokeInvitation(id),
        },
      ],
    );
  };

  const formatLastActive = (date?: string | null) => {
    if (!date) return 'Jamais connecté';
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    return `Il y a ${days} jours`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Équipe</Text>
        <Text style={styles.subtitle}>
          {members.length} membre{members.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Members list */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membres</Text>
          {canManage && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.inviteButtonText}>Inviter</Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingMembers ? (
          <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
        ) : members.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={32} color="#9CA3AF" />
            <Text style={styles.emptyText}>Aucun membre trouvé</Text>
          </View>
        ) : (
          members.map((member) => {
            const roleColor = ROLE_COLORS[member.role] ?? DEFAULT_ROLE_COLOR;
            const isMe = member.id === profile?.id;
            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>
                      {member.full_name || member.email}
                      {isMe ? '  (moi)' : ''}
                    </Text>
                  </View>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                  <View style={styles.memberMeta}>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
                      <RoleIcon role={member.role} />
                      <Text style={[styles.roleText, { color: roleColor.text }]}>
                        {ROLE_LABELS[member.role] ?? member.role}
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
                {canManage && member.id !== profile?.id && (
                  <View style={styles.memberXP}>
                    <Text style={styles.memberXPText}>{member.xp ?? 0} XP</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Pending invitations */}
      {canManage && (
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>
            Invitations en attente ({pendingInvitations.length})
          </Text>

          {loadingInvitations ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 12 }} />
          ) : pendingInvitations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Mail size={28} color="#9CA3AF" />
              <Text style={styles.emptyText}>Aucune invitation en attente</Text>
            </View>
          ) : (
            pendingInvitations.map((inv) => {
              const roleColor = ROLE_COLORS[inv.role] ?? DEFAULT_ROLE_COLOR;
              const expired = inv.expires_at && new Date(inv.expires_at) < new Date();
              return (
                <View key={inv.id} style={styles.invitationCard}>
                  <View style={styles.invitationLeft}>
                    <Mail size={18} color="#6B7280" />
                    <View style={styles.invitationInfo}>
                      <Text style={styles.invitationEmail}>{inv.email}</Text>
                      <View style={styles.memberMeta}>
                        <View style={[styles.roleBadge, { backgroundColor: roleColor.bg }]}>
                          <Text style={[styles.roleText, { color: roleColor.text }]}>
                            {ROLE_LABELS[inv.role] ?? inv.role}
                          </Text>
                        </View>
                        {expired && (
                          <Text style={styles.expiredBadge}>Expirée</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRevoke(inv.id, inv.email)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Invite modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Inviter un membre</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Adresse e-mail *</Text>
            <TextInput
              style={styles.input}
              placeholder="prenom.nom@example.com"
              placeholderTextColor="#9CA3AF"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Rôle</Text>
            <TouchableOpacity
              style={styles.rolePicker}
              onPress={() => setRolePickerOpen(!rolePickerOpen)}
            >
              <Text style={styles.rolePickerText}>
                {ROLE_LABELS[inviteRole] ?? inviteRole}
              </Text>
              <ChevronDown size={18} color="#6B7280" />
            </TouchableOpacity>
            {rolePickerOpen && (
              <View style={styles.roleDropdown}>
                {INVITE_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOption,
                      inviteRole === r && styles.roleOptionActive,
                    ]}
                    onPress={() => {
                      setInviteRole(r);
                      setRolePickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        inviteRole === r && styles.roleOptionTextActive,
                      ]}
                    >
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!!inviteError && (
              <Text style={styles.errorText}>{inviteError}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!inviteEmail.trim() || submitting) && styles.submitDisabled,
              ]}
              onPress={handleInvite}
              disabled={!inviteEmail.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Envoyer l'invitation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  section: { marginHorizontal: 20, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  inviteButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  memberEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 1, marginBottom: 6 },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  memberXP: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberXPText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  invitationLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  invitationInfo: { flex: 1 },
  invitationEmail: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 6 },
  expiredBadge: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
  },
  rolePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 4,
  },
  rolePickerText: { fontSize: 15, color: '#111827' },
  roleDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  roleOptionActive: { backgroundColor: '#EFF6FF' },
  roleOptionText: { fontSize: 15, color: '#374151' },
  roleOptionTextActive: { color: '#2563EB', fontWeight: '600' },
  errorText: { fontSize: 13, color: '#DC2626', marginBottom: 12, textAlign: 'center' },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
