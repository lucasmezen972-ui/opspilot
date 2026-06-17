import {
  MapPin,
  CircleAlert as AlertCircle,
  Camera,
  Download,
  Play,
  CircleCheck as CheckCircle,
  Lock,
  PenLine,
} from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import {
  getAuditStatusColor,
  getAuditStatusIcon,
  getAuditStatusText,
  type AuditListItem,
} from './auditListModel';
import { signatureSummary } from './auditSignatureModel';
import type { AuditSignature } from '../../lib/supabase';
import { AppBadge } from '../../shared/components/AppBadge';
import { colors, shadow } from '../../shared/styles/tokens';
import { isAuditLocked } from '../governance/governanceModel';

interface AuditListCardProps {
  audit: AuditListItem;
  signatures?: AuditSignature[];
  canSign?: boolean;
  onOpenCamera: (auditId: string) => void;
  onExportReport: (auditId: string) => void;
  onChangeStatus: (auditId: string, status: string) => void;
  onSign?: (auditId: string) => void;
}

/** Carte d'un audit dans la liste : titre, lieu, statut, score, actions. */
export function AuditListCard({
  audit,
  signatures = [],
  canSign = false,
  onOpenCamera,
  onExportReport,
  onChangeStatus,
  onSign,
}: AuditListCardProps) {
  const StatusIcon = getAuditStatusIcon(audit.status);
  const locked = isAuditLocked(audit);
  const signed = signatures.length > 0;
  return (
    <TouchableOpacity
      testID={`audit-card-${audit.id}`}
      style={styles.auditCard}
    >
      <View style={styles.auditHeader}>
        <View style={styles.auditTitleSection}>
          <Text style={styles.auditTitle}>{audit.title}</Text>
          <View style={styles.auditLocation}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.auditLocationText}>{audit.location}</Text>
          </View>
        </View>
        <View style={styles.auditStatusGroup}>
          {locked && (
            <AppBadge
              testID={`audit-locked-${audit.id}`}
              tone="neutral"
              icon={Lock}
              label="Verrouillé"
            />
          )}
          <View
            style={[
              styles.auditStatus,
              { backgroundColor: `${getAuditStatusColor(audit.status)}20` },
            ]}
          >
            <StatusIcon size={16} color={getAuditStatusColor(audit.status)} />
            <Text
              style={[
                styles.auditStatusText,
                { color: getAuditStatusColor(audit.status) },
              ]}
            >
              {getAuditStatusText(audit.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.auditDetails}>
        <Text style={styles.auditDate}>{audit.date}</Text>
        {audit.score != null && (
          <View style={styles.auditScore}>
            <Text style={styles.auditScoreText}>Score: {audit.score}%</Text>
          </View>
        )}
        {audit.issues > 0 && (
          <View style={styles.auditIssues}>
            <AlertCircle size={14} color="#F59E0B" />
            <Text style={styles.auditIssuesText}>{audit.issues} problèmes</Text>
          </View>
        )}
      </View>

      {(signed || canSign) && (
        <View
          style={styles.signatureBlock}
          testID={`audit-signature-${audit.id}`}
        >
          {signed && (
            <View style={styles.signatureRow}>
              <PenLine size={13} color={colors.textMuted} />
              <Text style={styles.signatureText}>
                {signatureSummary(signatures)}
              </Text>
            </View>
          )}
          {canSign && onSign && (
            <TouchableOpacity
              testID={`audit-sign-${audit.id}`}
              style={styles.signButton}
              onPress={() => onSign(audit.id)}
            >
              <PenLine size={14} color={colors.primary} />
              <Text style={styles.signButtonText}>Signer l’audit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.auditActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onOpenCamera(audit.id)}
        >
          <Camera size={16} color="#2563EB" />
          <Text style={styles.actionButtonText}>Preuve photo</Text>
        </TouchableOpacity>
        {audit.status === 'completed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.reportActionButton]}
            onPress={() => onExportReport(audit.id)}
          >
            <Download size={16} color="#7C3AED" />
            <Text style={[styles.actionButtonText, { color: '#7C3AED' }]}>
              Rapport
            </Text>
          </TouchableOpacity>
        )}
        {audit.status === 'pending' && (
          <TouchableOpacity
            testID={`audit-start-${audit.id}`}
            style={[styles.actionButton, styles.startActionButton]}
            onPress={() => onChangeStatus(audit.id, audit.status)}
          >
            <Play size={16} color="#F59E0B" />
            <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>
              Démarrer
            </Text>
          </TouchableOpacity>
        )}
        {audit.status === 'in_progress' && (
          <TouchableOpacity
            testID={`audit-finish-${audit.id}`}
            style={[styles.actionButton, styles.completeActionButton]}
            onPress={() => onChangeStatus(audit.id, audit.status)}
          >
            <CheckCircle size={16} color="#10B981" />
            <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
              Terminer
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  auditTitleSection: {
    flex: 1,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  auditLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditLocationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  auditStatusGroup: {
    alignItems: 'flex-end',
    gap: 6,
  },
  auditStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  auditStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  auditDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  auditDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  auditScore: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  auditScoreText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
  auditIssues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditIssuesText: {
    fontSize: 12,
    color: '#D97706',
    marginLeft: 4,
  },
  signatureBlock: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signatureText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  auditActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
  reportActionButton: {
    backgroundColor: '#EDE9FE',
  },
  startActionButton: {
    backgroundColor: '#FEF3C7',
  },
  completeActionButton: {
    backgroundColor: '#DCFCE7',
  },
});
