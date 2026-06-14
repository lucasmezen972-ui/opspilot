import { Building2, Download, FileSpreadsheet } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type {
  ReportEvolution,
  SiteConformityRow,
} from './directionReportModel';
import { colors, radius, spacing, shadow } from '../../shared/styles/tokens';

type Props = {
  sites: SiteConformityRow[];
  evolution: ReportEvolution;
  canExport: boolean;
  onExport: (format: 'csv' | 'xlsx') => void;
};

function conformityColor(value: number | null): string {
  if (value == null) return colors.textMuted;
  if (value >= 80) return colors.successText;
  if (value >= 70) return colors.warningText;
  return colors.dangerStrong;
}

/** Rapport direction multi-sites : évolution, conformité par site, exports. */
export function DirectionReport({
  sites,
  evolution,
  canExport,
  onExport,
}: Props) {
  return (
    <View style={styles.section} testID="direction-report">
      <View style={styles.head}>
        <Building2 size={18} color={colors.primary} />
        <Text style={styles.title}>Rapport direction — multi-sites</Text>
      </View>

      <View style={styles.evolution}>
        <View style={styles.evoCard}>
          <Text style={styles.evoValue}>{evolution.completed30d}</Text>
          <Text style={styles.evoLabel}>Audits clôturés · 30 j</Text>
        </View>
        <View style={styles.evoCard}>
          <Text style={styles.evoValue}>{evolution.completed90d}</Text>
          <Text style={styles.evoLabel}>Audits clôturés · 90 j</Text>
        </View>
        <View style={styles.evoCard}>
          <Text
            style={[
              styles.evoValue,
              { color: conformityColor(evolution.conformity30d) },
            ]}
          >
            {evolution.conformity30d != null
              ? `${evolution.conformity30d}%`
              : '—'}
          </Text>
          <Text style={styles.evoLabel}>Conformité · 30 j</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.rowHead]}>
          <Text style={[styles.cell, styles.cellSite, styles.cellHead]}>
            Site
          </Text>
          <Text style={[styles.cell, styles.cellHead]}>Audits</Text>
          <Text style={[styles.cell, styles.cellHead]}>Conf.</Text>
          <Text style={[styles.cell, styles.cellHead]}>NC</Text>
        </View>
        {sites.map((site) => (
          <View
            key={site.site}
            style={styles.row}
            testID={`direction-site-${site.site}`}
          >
            <Text style={[styles.cell, styles.cellSite]} numberOfLines={1}>
              {site.site}
            </Text>
            <Text style={styles.cell}>
              {site.completed}/{site.audits}
            </Text>
            <Text
              style={[styles.cell, { color: conformityColor(site.conformity) }]}
            >
              {site.conformity != null ? `${site.conformity}%` : '—'}
            </Text>
            <Text style={styles.cell}>{site.nonConformities}</Text>
          </View>
        ))}
        {sites.length === 0 && (
          <View style={styles.row}>
            <Text style={[styles.cell, styles.empty]}>
              Aucun audit à reporter.
            </Text>
          </View>
        )}
      </View>

      {canExport && sites.length > 0 && (
        <View style={styles.exports}>
          <TouchableOpacity
            testID="direction-export-csv"
            style={styles.exportBtn}
            onPress={() => onExport('csv')}
          >
            <Download size={16} color={colors.primary} />
            <Text style={styles.exportText}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="direction-export-xlsx"
            style={styles.exportBtn}
            onPress={() => onExport('xlsx')}
          >
            <FileSpreadsheet size={16} color={colors.primary} />
            <Text style={styles.exportText}>Excel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.xl,
    paddingBottom: 0,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textStrong,
  },
  evolution: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  evoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  evoValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textStrong,
  },
  evoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  table: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowHead: {
    backgroundColor: colors.backgroundAlt,
  },
  cell: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    textAlign: 'right',
  },
  cellSite: {
    flex: 2.4,
    textAlign: 'left',
    fontWeight: '600',
    color: colors.textStrong,
  },
  cellHead: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
  },
  exports: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  exportText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
