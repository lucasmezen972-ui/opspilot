import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from './useAuth';
import {
  currentTemplateVersion,
  extractSections,
  initialTemplateVersions,
} from '../features/audits/auditStructureModel';
import { useDemoCollection } from '../lib/demoStore';
import {
  supabase,
  type AuditTemplate,
  type AuditTemplateItem,
} from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useAuditTemplates() {
  const [remoteTemplates, setRemoteTemplates] = useState<AuditTemplate[]>([]);
  const [remoteItems, setRemoteItems] = useState<AuditTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;
  const demoTemplates = useDemoCollection('auditTemplates');
  const demoItems = useDemoCollection('auditTemplateItems');
  const templates = isLocalDemo ? demoTemplates : remoteTemplates;
  const items = isLocalDemo ? demoItems : remoteItems;

  const fetchTemplates = useCallback(async () => {
    if (isLocalDemo) {
      setLoading(false);
      return;
    }
    if (!profile?.organization_id) {
      setRemoteTemplates([]);
      setRemoteItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data: templateData, error: templateError } = await supabase
        .from('audit_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name');

      if (templateError) {
        setError(
          mapSupabaseError(
            'Erreur lors de la récupération des modèles',
            templateError,
          ),
        );
        return;
      }

      const nextTemplates = (templateData || []) as AuditTemplate[];
      setRemoteTemplates(nextTemplates);
      if (nextTemplates.length === 0) {
        setRemoteItems([]);
        return;
      }

      const { data: itemData, error: itemError } = await supabase
        .from('audit_template_items')
        .select('*')
        .in(
          'template_id',
          nextTemplates.map((template) => template.id),
        )
        .order('sort_order');

      if (itemError) {
        setError(
          mapSupabaseError(
            'Erreur lors de la récupération des critères',
            itemError,
          ),
        );
        return;
      }
      setRemoteItems((itemData || []) as AuditTemplateItem[]);
    } catch (err) {
      setError(mapSupabaseError('Erreur fetchAuditTemplates', err));
    } finally {
      setLoading(false);
    }
  }, [isLocalDemo, profile?.organization_id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getItemsForTemplate = useCallback(
    (templateId: string) =>
      items
        .filter((item) => item.template_id === templateId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [items],
  );

  // Versions de modèle (v1 initiale) + sections normalisées dérivées des
  // critères : socle de reproductibilité (table audit_template_versions / sections).
  const versions = useMemo(
    () => initialTemplateVersions(templates, items),
    [templates, items],
  );
  const getTemplateVersion = useCallback(
    (templateId: string) => currentTemplateVersion(versions, templateId),
    [versions],
  );
  const getSectionsForTemplate = useCallback(
    (templateId: string) => extractSections(templateId, items),
    [items],
  );

  return {
    templates,
    items,
    loading,
    error,
    getItemsForTemplate,
    getTemplateVersion,
    getSectionsForTemplate,
    refetch: fetchTemplates,
  };
}
