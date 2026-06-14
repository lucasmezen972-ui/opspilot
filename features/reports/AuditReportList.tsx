import { FileText, Download } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { Audit } from '../../lib/supabase';
import { colors, shadow } from '../../shared/styles/tokens';

interface AuditReportListProps {
  audits: Audit[];
  onExport: (audit: Audit) => void;
}

/** Liste des audits terminés avec export PDF unitaire. */
export function AuditReportList({ audits, onExport }: AuditReportListProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Rapports d'audit</Text>
      <View style={styles.list}>
        {audits.map((audit, idx) => (
          <View
            key={audit.id}
            style={[styles.item, idx < audits.length - 1 && styles.itemBorder]}
          >
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {audit.title}
              </Text>
              <Text style={styles.meta}>
                {audit.completed_at
                  ? new Date(audit.completed_at).toLocaleDateString('fr-FR')
                  : '—'}
                {audit.score != null ? ` · Score ${audit.score}%` : ''}
              </Text>
            </View>
            <TouchableOpacity
              testID={`report-download-${audit.id}`}
              style={styles.download}
              onPress={() => onExport(audit)}
            >
              <Download size={16} color="#2563EB" />
              <Text style={styles.downloadText}>PDF</Text>
            </TouchableOpacity>
          </View>
        ))}
        {audits.length === 0 && (
          <View style={styles.empty}>
            <FileText size={32} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              Aucun audit terminé : terminez un audit pour générer son rapport.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  meta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
