import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './useAuth';
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
      const { data: templateData, error: templateError } = await supabase
        .from('audit_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name');

      if (templateError) {
        mapSupabaseError(
          'Erreur lors de la récupération des modèles',
          templateError,
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
        mapSupabaseError(
          'Erreur lors de la récupération des critères',
          itemError,
        );
        return;
      }
      setRemoteItems((itemData || []) as AuditTemplateItem[]);
    } catch (error) {
      mapSupabaseError('Erreur fetchAuditTemplates', error);
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

  return {
    templates,
    items,
    loading,
    getItemsForTemplate,
    refetch: fetchTemplates,
  };
}
