import { Sparkles, X } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { colors, radius, shadow } from '../../shared/styles/tokens';

interface ActionPlanModalProps {
  visible: boolean;
  subject: string;
  loading: boolean;
  planText: string | null;
  /** Origine du plan : généré par l'IA en ligne, ou proposé localement. */
  source: 'ia' | 'local' | null;
  onClose: () => void;
}

/** Modale affichant le plan d'action correctif (IA en ligne ou proposé). */
export function ActionPlanModal({
  visible,
  subject,
  loading,
  planText,
  source,
  onClose,
}: ActionPlanModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content} testID="action-plan-modal">
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={18} color="#7C3AED" />
              <Text style={styles.title}>Plan d'action correctif</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="action-plan-close">
              <X size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subject} numberOfLines={2}>
            {subject}
          </Text>

          {source && !loading && (
            <View
              style={[
                styles.sourceBadge,
                source === 'ia' ? styles.sourceIa : styles.sourceLocal,
              ]}
            >
              <Text
                style={[
                  styles.sourceText,
                  source === 'ia'
                    ? styles.sourceIaText
                    : styles.sourceLocalText,
                ]}
              >
                {source === 'ia' ? 'Généré par l’IA' : 'Plan proposé'}
              </Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Génération du plan…</Text>
            </View>
          ) : (
            <ScrollView style={styles.body}>
              <Text style={styles.planText} testID="action-plan-text">
                {planText}
              </Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '82%',
    ...shadow.floating,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textStrong,
    letterSpacing: -0.3,
  },
  subject: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 14,
  },
  sourceIa: {
    backgroundColor: '#F3E8FF',
  },
  sourceLocal: {
    backgroundColor: colors.backgroundAlt,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sourceIaText: {
    color: '#7C3AED',
  },
  sourceLocalText: {
    color: colors.textMuted,
  },
  loading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  body: {
    marginTop: 2,
  },
  planText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
});
