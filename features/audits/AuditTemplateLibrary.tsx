import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { AuditTemplate } from '../../lib/supabase';

interface AuditTemplateLibraryProps {
  templates: AuditTemplate[];
  expanded: boolean;
  loading: boolean;
  onToggle: () => void;
  onSelectTemplate: (template: AuditTemplate) => void;
  getItemCount: (templateId: string) => number;
  getVersion?: (templateId: string) => number;
  getSectionCount?: (templateId: string) => number;
}

/**
 * Bibliothèque de modèles d'audit : section dépliable proposant les
 * modèles prêts à l'emploi pour démarrer un audit en un clic.
 */
export function AuditTemplateLibrary({
  templates,
  expanded,
  loading,
  onToggle,
  onSelectTemplate,
  getItemCount,
  getVersion,
  getSectionCount,
}: AuditTemplateLibraryProps) {
  return (
    <View>
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <View style={styles.headerLeft}>
          <BookOpen size={16} color="#2563EB" />
          <Text style={styles.headerText}>Bibliothèque de modèles</Text>
        </View>
        {expanded ? (
          <ChevronDown size={16} color="#6B7280" />
        ) : (
          <ChevronRight size={16} color="#6B7280" />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.grid}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              testID={`audit-template-${template.id}`}
              style={styles.card}
              onPress={() => onSelectTemplate(template)}
            >
              <BookOpen size={22} color="#2563EB" />
              <Text style={styles.name}>{template.name}</Text>
              <Text style={styles.meta}>
                v{getVersion?.(template.id) ?? 1} ·{' '}
                {template.estimated_duration ?? 20} min ·{' '}
                {getSectionCount
                  ? `${getSectionCount(template.id)} sections · `
                  : ''}
                {getItemCount(template.id)} critères
              </Text>
            </TouchableOpacity>
          ))}
          {loading && (
            <Text style={styles.loading}>Chargement des modèles...</Text>
          )}
          {!loading && templates.length === 0 && (
            <Text style={styles.loading}>
              Aucun modèle disponible. Créez un audit libre.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    gap: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1D4ED8',
  },
  meta: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  loading: {
    paddingVertical: 12,
    color: '#6B7280',
    fontSize: 13,
  },
});
