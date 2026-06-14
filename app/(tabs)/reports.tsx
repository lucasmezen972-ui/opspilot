import { FileText, Download } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { AuditReportList } from '../../features/reports/AuditReportList';
import { ReportStatsGrid } from '../../features/reports/ReportStatsGrid';
import {
  buildReportStats,
  getCompletedAudits,
} from '../../features/reports/reportsModel';
import { useAuditTemplates } from '../../hooks/useAuditTemplates';
import { useAudits } from '../../hooks/useAudits';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import type { Audit } from '../../lib/supabase';
import { exportAuditReport } from '../../utils/auditReport';
import { exportAuditsAsCSV } from '../../utils/exportAudits';

export default function ReportsScreen() {
  const { audits, getAuditResponses } = useAudits();
  const { actions } = useCorrectiveActions();
  const { getItemsForTemplate } = useAuditTemplates();

  const completed = useMemo(() => getCompletedAudits(audits), [audits]);
  const stats = useMemo(
    () => buildReportStats(audits, actions),
    [audits, actions],
  );

  // Rapport PDF enrichi : critères détaillés + plan d'action correctif lié.
  const handleExport = async (audit: Audit) => {
    const responses = await getAuditResponses(audit.id);
    const items = audit.template_id
      ? getItemsForTemplate(audit.template_id)
      : [];
    const auditActions = actions.filter((a) => a.audit_id === audit.id);
    await exportAuditReport(audit, {
      responses,
      items,
      actions: auditActions,
    });
  };

  return (
    <ScrollView style={styles.container} testID="reports-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.title} testID="page-reports-title">
            Rapports
          </Text>
          <Text style={styles.subtitle}>Synthèse conformité & exports</Text>
        </View>
        <View style={styles.headerIcon}>
          <FileText size={22} color="#2563EB" />
        </View>
      </View>

      <ReportStatsGrid stats={stats} />

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

      <AuditReportList audits={completed} onExport={handleExport} />

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
    letterSpacing: -0.4,
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
  bottomPadding: {
    height: 24,
  },
});
