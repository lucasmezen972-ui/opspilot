import {
  FileText,
  Download,
  TrendingUp,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Wrench,
  ClipboardCheck,
} from 'lucide-react-native';
import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { useAudits } from '../../hooks/useAudits';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import { exportAuditReport } from '../../utils/auditReport';
import { exportAuditsAsCSV } from '../../utils/exportAudits';

export default function ReportsScreen() {
  const { audits } = useAudits();
  const { actions } = useCorrectiveActions();

  const completed = useMemo(
    () => audits.filter((a) => a.status === 'completed'),
    [audits],
  );

  const avgScore = useMemo(() => {
    const scored = completed.filter((a) => a.score != null);
    if (scored.length === 0) return null;
    return Math.round(
      scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length,
    );
  }, [completed]);

  const conformityRate = useMemo(() => {
    if (completed.length === 0) return null;
    const conform = completed.filter((a) => (a.score ?? 0) >= 80).length;
    return Math.round((conform / completed.length) * 100);
  }, [completed]);

  const openActions = useMemo(
    () =>
      actions.filter((a) => a.status === 'open' || a.status === 'in_progress')
        .length,
    [actions],
  );

  const resolvedActions = useMemo(
    () => actions.filter((a) => a.status === 'done').length,
    [actions],
  );

  const stats = [
    {
      label: 'Audits terminés',
      value: completed.length,
      icon: ClipboardCheck,
      color: '#2563EB',
    },
    {
      label: 'Score moyen',
      value: avgScore != null ? `${avgScore}%` : '—',
      icon: TrendingUp,
      color: avgScore != null && avgScore >= 80 ? '#10B981' : '#F59E0B',
    },
    {
      label: 'Taux de conformité',
      value: conformityRate != null ? `${conformityRate}%` : '—',
      icon: CheckCircle,
      color:
        conformityRate != null && conformityRate >= 80 ? '#10B981' : '#EF4444',
    },
    {
      label: 'Actions ouvertes',
      value: openActions,
      icon: Wrench,
      color: openActions > 0 ? '#F59E0B' : '#10B981',
    },
    {
      label: 'Actions résolues',
      value: resolvedActions,
      icon: CheckCircle,
      color: '#10B981',
    },
    {
      label: 'Non-conformités',
      value: audits.reduce((sum, a) => sum + (a.issues_count ?? 0), 0),
      icon: AlertTriangle,
      color: '#EF4444',
    },
  ];

  return (
    <ScrollView style={styles.container} testID="reports-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rapports</Text>
          <Text style={styles.subtitle}>
            Synthèse conformité & exports
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <FileText size={22} color="#2563EB" />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synthèse</Text>
        <View style={styles.statsGrid}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <View key={s.label} style={styles.statCard}>
                <Icon size={18} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>
                  {s.value}
                </Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Exports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exports</Text>
        <TouchableOpacity
          testID="export-csv-button"
          style={styles.exportButton}
          onPress={() => exportAuditsAsCSV(audits)}
          disabled={audits.length === 0}
        >
          <Download size={18} color="#FFFFFF" />
          <Text style={styles.exportButtonText}>
            Exporter tous les audits (CSV)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Per-audit reports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rapports d'audit</Text>
        <View style={styles.reportList}>
          {completed.map((audit, idx) => (
            <View
              key={audit.id}
              style={[
                styles.reportItem,
                idx < completed.length - 1 && styles.reportItemBorder,
              ]}
            >
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle} numberOfLines={1}>
                  {audit.title}
                </Text>
                <Text style={styles.reportMeta}>
                  {audit.completed_at
                    ? new Date(audit.completed_at).toLocaleDateString('fr-FR')
                    : '—'}
                  {audit.score != null ? ` · Score ${audit.score}%` : ''}
                </Text>
              </View>
              <TouchableOpacity
                testID={`report-download-${audit.id}`}
                style={styles.reportDownload}
                onPress={() => exportAuditReport(audit)}
              >
                <Download size={16} color="#2563EB" />
                <Text style={styles.reportDownloadText}>PDF</Text>
              </TouchableOpacity>
            </View>
          ))}
          {completed.length === 0 && (
            <View style={styles.emptyState}>
              <FileText size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                Aucun audit terminé : terminez un audit pour générer son
                rapport.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reportList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  reportItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  reportMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  reportDownload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportDownloadText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
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
  bottomPadding: {
    height: 24,
  },
});
