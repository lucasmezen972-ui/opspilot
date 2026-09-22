import { Users, Mail, Plus } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import RequireRole from '../../components/RequireRole';
import { InvitationCard } from '../../features/team/InvitationCard';
import { InviteMemberModal } from '../../features/team/InviteMemberModal';
import { MemberCard } from '../../features/team/MemberCard';
import { useAuth } from '../../hooks/useAuth';
import { useInvitations } from '../../hooks/useInvitations';
import { useTeam } from '../../hooks/useTeam';
import type { Invitation } from '../../lib/supabase';
import { colors } from '../../shared/styles/tokens';

export default function TeamScreen() {
  return (
    <RequireRole roles={['manager', 'admin', 'superadmin']}>
      <TeamScreenContent />
    </RequireRole>
  );
}

function TeamScreenContent() {
  const { profile } = useAuth();
  const {
    members,
    loading: loadingMembers,
    error: membersError,
    deactivateMember,
  } = useTeam();
  const {
    invitations,
    loading: loadingInvitations,
    canManage,
    createInvitation,
    revokeInvitation,
  } = useInvitations();

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  const handleInvite = async (email: string, role: Invitation['role']) => {
    if (!email.trim()) return;
    setInviteError(null);
    setSubmitting(true);
    const { error } = await createInvitation(email, role);
    setSubmitting(false);
    if (error) {
      setInviteError(
        typeof error === 'string' ? error : "Erreur lors de l'invitation",
      );
      return;
    }
    setModalVisible(false);
  };

  const handleDeactivate = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    Alert.alert(
      'Désactiver le membre',
      `Retirer ${member?.full_name ?? member?.email ?? 'ce membre'} de l'équipe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deactivateMember(memberId);
            if (error) Alert.alert('Erreur', String(error));
          },
        },
      ],
    );
  };

  const handleRevoke = (id: string, email: string) => {
    Alert.alert(
      "Révoquer l'invitation",
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} testID="page-team-title">
          Équipe
        </Text>
        <Text style={styles.subtitle}>
          {members.length} membre{members.length > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membres</Text>
          {canManage && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={16} color={colors.surface} />
              <Text style={styles.inviteButtonText}>Inviter</Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingMembers ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : membersError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{membersError}</Text>
          </View>
        ) : members.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun membre trouvé</Text>
          </View>
        ) : (
          members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isMe={member.id === profile?.id}
              showXP={canManage && member.id !== profile?.id}
              onDeactivate={canManage ? handleDeactivate : undefined}
            />
          ))
        )}
      </View>

      {canManage && (
        <View style={[styles.section, styles.sectionLast]}>
          <Text style={styles.sectionTitle}>
            Invitations en attente ({pendingInvitations.length})
          </Text>

          {loadingInvitations ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.loaderSmall}
            />
          ) : pendingInvitations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Mail size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucune invitation en attente</Text>
            </View>
          ) : (
            pendingInvitations.map((inv) => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                onRevoke={handleRevoke}
              />
            ))
          )}
        </View>
      )}

      <InviteMemberModal
        visible={modalVisible}
        submitting={submitting}
        error={inviteError}
        onClose={() => setModalVisible(false)}
        onSubmit={handleInvite}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.text,
  },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  section: { marginHorizontal: 20, marginTop: 20 },
  sectionLast: { marginBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  inviteButtonText: { color: colors.surface, fontSize: 14, fontWeight: '600' },
  loader: { marginTop: 20 },
  loaderSmall: { marginTop: 12 },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 14, color: colors.textMuted },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: { fontSize: 14, color: colors.danger },
});
