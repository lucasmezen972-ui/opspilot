import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { getDemoAudits, demoId } from '../lib/demoData';
import { supabase, type Audit } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, isDemoMode, session } = useAuth();

  // Mode démo local (Supabase injoignable) : données en mémoire, jamais vides.
  const isLocalDemo = isDemoMode && !session;

  const fetchAudits = useCallback(async () => {
    if (isLocalDemo) {
      setAudits(getDemoAudits());
      setLoading(false);
      return;
    }
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        mapSupabaseError('Erreur lors de la récupération des audits', error);
        return;
      }

      setAudits(data || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchAudits', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isLocalDemo]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const createAudit = async (auditData: Partial<Audit>) => {
    if (!user || !profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    if (isLocalDemo) {
      const now = new Date().toISOString();
      const data: Audit = {
        id: demoId('demo-audit'),
        organization_id: profile.organization_id,
        store_id: profile.store_id ?? null,
        template_id: null,
        auditor_id: user.id,
        title: auditData.title || '',
        description: auditData.description ?? null,
        location: auditData.location ?? null,
        status: auditData.status || 'pending',
        score: auditData.score ?? null,
        max_score: auditData.max_score || 100,
        issues_count: 0,
        photos: [],
        notes: auditData.notes ?? null,
        started_at: null,
        completed_at: null,
        due_date: auditData.due_date ?? null,
        created_at: now,
        updated_at: now,
      };
      setAudits((prev) => [data, ...prev]);
      return { data, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('audits')
        .insert({
          organization_id: profile.organization_id,
          auditor_id: user.id,
          title: auditData.title || '',
          description: auditData.description || null,
          location: auditData.location || null,
          status: auditData.status || 'pending',
          max_score: auditData.max_score || 100,
          issues_count: 0,
          photos: [],
          ...auditData,
        })
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError(
            "Erreur lors de la création de l'audit",
            error,
          ),
        };
      }

      setAudits((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur createAudit', error),
      };
    }
  };

  const updateAuditStatus = async (id: string, status: string) => {
    try {
      const updates: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (
        status === 'in_progress' &&
        !audits.find((a) => a.id === id)?.started_at
      ) {
        updates.started_at = new Date().toISOString();
      }
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      if (isLocalDemo) {
        let updated: Audit | null = null;
        setAudits((prev) =>
          prev.map((a) => {
            if (a.id !== id) return a;
            updated = { ...a, ...updates } as Audit;
            return updated;
          }),
        );
        return { data: updated, error: null };
      }

      const { data, error } = await supabase
        .from('audits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError(
            'Erreur lors de la mise à jour du statut',
            error,
          ),
        };
      }

      setAudits((prev) => prev.map((a) => (a.id === id ? data : a)));
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur updateAuditStatus', error),
      };
    }
  };

  // Clôture d'audit avec résultat du questionnaire (score + non-conformités).
  const completeAudit = async (
    id: string,
    score: number,
    issuesCount: number,
  ) => {
    const updates: Record<string, any> = {
      status: 'completed',
      score,
      issues_count: issuesCount,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLocalDemo) {
      let updated: Audit | null = null;
      setAudits((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          updated = { ...a, ...updates } as Audit;
          return updated;
        }),
      );
      return { data: updated, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('audits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        return {
          data: null,
          error: mapSupabaseError("Erreur lors de la clôture de l'audit", error),
        };
      }
      setAudits((prev) => prev.map((a) => (a.id === id ? data : a)));
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur completeAudit', error),
      };
    }
  };

  const addPhotoToAudit = async (id: string, photoUrl: string) => {
    try {
      const audit = audits.find((a) => a.id === id);
      if (!audit) return { data: null, error: 'Audit introuvable' };

      const updatedPhotos = [...(audit.photos || []), photoUrl];

      if (isLocalDemo) {
        const updated: Audit = {
          ...audit,
          photos: updatedPhotos,
          updated_at: new Date().toISOString(),
        };
        setAudits((prev) => prev.map((a) => (a.id === id ? updated : a)));
        return { data: updated, error: null };
      }

      const { data, error } = await supabase
        .from('audits')
        .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: mapSupabaseError("Erreur lors de l'ajout de la photo", error),
        };
      }

      setAudits((prev) => prev.map((a) => (a.id === id ? data : a)));
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: mapSupabaseError('Erreur addPhotoToAudit', error),
      };
    }
  };

  return {
    audits,
    loading,
    createAudit,
    updateAuditStatus,
    completeAudit,
    addPhotoToAudit,
    refetch: fetchAudits,
  };
}
