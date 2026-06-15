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
import { DirectionReport } from '../../features/reports/DirectionReport';
import { ReportStatsGrid } from '../../features/reports/ReportStatsGrid';
import {
  buildEvolution,
  buildSiteConformity,
  directionReportRows,
} from '../../features/reports/directionReportModel';
import {
  buildReportStats,
  getCompletedAudits,
} from '../../features/reports/reportsModel';
import { useActivityLog } from '../../hooks/useActivityLog';
import { useAuditTemplates } from '../../hooks/useAuditTemplates';
import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../hooks/useAuth';
import { useCorrectiveActions } from '../../hooks/useCorrectiveActions';
import type { Audit } from '../../lib/supabase';
import { AppScreenHeader } from '../../shared/components/AppScreenHeader';
import { colors } from '../../shared/styles/tokens';
import { exportAuditReport } from '../../utils/auditReport';
import { downloadDataset } from '../../utils/export';
import { exportAuditsAsCSV } from '../../utils/exportAudits';
import { can } from '../../utils/permissions';

export default function ReportsScreen() {
  const { profile } = useAuth();
  const { audits, getAuditResponses } = useAudits();
  const { actions } = useCorrectiveActions();
  const { getItemsForTemplate } = useAuditTemplates();
  const { logEvent } = useActivityLog();
  const canExport = can(profile?.role, 'reports.export');

  const completed = useMemo(() => getCompletedAudits(audits), [audits]);
  const stats = useMemo(
    () => buildReportStats(audits, actions),
    [audits, actions],
  );
  const sites = useMemo(() => buildSiteConformity(audits), [audits]);
  const evolution = useMemo(() => buildEvolution(audits), [audits]);

  const handleExportDirection = (format: 'csv' | 'xlsx') => {
    logEvent({
      action: 'export',
      entityType: 'report',
      label: `Export du rapport direction (${format.toUpperCase()}).`,
    });
    return downloadDataset(
      directionReportRows(sites),
      'rapport-direction',
      format,
    );
  };

  // Rapport PDF enrichi : critères détaillés + plan d'action correctif lié.
  const handleExport = async (audit: Audit) => {
    logEvent({
      action: 'export',
      entityType: 'audit',
      entityId: audit.id,
      label: `Export du rapport d’audit « ${audit.title} ».`,
    });
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
      <AppScreenHeader
        title="Rapports"
        titleTestID="page-reports-title"
        subtitle="Synthèse conformité & exports"
        right={
          <View style={styles.headerIcon}>
            <FileText size={22} color={colors.primary} />
          </View>
        }
      />

      <ReportStatsGrid stats={stats} />

      <DirectionReport
        sites={sites}
        evolution={evolution}
        canExport={canExport}
        onExport={handleExportDirection}
      />

      {canExport && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exports</Text>
          <TouchableOpacity
            testID="export-csv-button"
            style={styles.exportButton}
            onPress={() => {
              logEvent({
                action: 'export',
                entityType: 'audit',
                label: `Export CSV de ${audits.length} audit(s).`,
              });
              return exportAuditsAsCSV(audits);
            }}
            disabled={audits.length === 0}
          >
            <Download size={18} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>
              Exporter tous les audits (CSV)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <AuditReportList
        audits={completed}
        onExport={canExport ? handleExport : undefined}
      />

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
