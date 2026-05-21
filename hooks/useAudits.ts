import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { DEMO_AUDITS } from '../lib/demo';
import { supabase, type Audit } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, isDemo } = useAuth();

  const fetchAudits = useCallback(async () => {
    if (isDemo) {
      setAudits(DEMO_AUDITS);
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
        mapSupabaseError('Erreur lors de la recuperation des audits', error);
        return;
      }

      setAudits(data || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchAudits', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, isDemo]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const createAudit = async (auditData: Partial<Audit>) => {
    if (!user || (!profile?.organization_id && !isDemo)) {
      return { data: null, error: 'Utilisateur non connecte' };
    }

    if (isDemo) {
      const newAudit: Audit = {
        id: `demo-audit-${Date.now()}`,
        organization_id: profile!.organization_id!,
        auditor_id: user.id,
        title: auditData.title || '',
        description: auditData.description || null,
        location: auditData.location || null,
        status: auditData.status || 'pending',
        score: null,
        max_score: auditData.max_score || 100,
        issues_count: 0,
        photos: [],
        notes: null,
        started_at: null,
        completed_at: null,
        due_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAudits((prev) => [newAudit, ...prev]);
      return { data: newAudit, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('audits')
        .insert({
          organization_id: profile!.organization_id,
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
            "Erreur lors de la creation de l'audit",
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
    if (isDemo) {
      setAudits((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: status as Audit['status'],
                updated_at: new Date().toISOString(),
                ...(status === 'in_progress' && !a.started_at
                  ? { started_at: new Date().toISOString() }
                  : {}),
                ...(status === 'completed'
                  ? { completed_at: new Date().toISOString(), score: Math.floor(Math.random() * 20) + 80 }
                  : {}),
              }
            : a,
        ),
      );
      return { data: true, error: null };
    }

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
            'Erreur lors de la mise a jour du statut',
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

  const addPhotoToAudit = async (id: string, photoUrl: string) => {
    if (isDemo) {
      setAudits((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, photos: [...(a.photos || []), photoUrl] }
            : a,
        ),
      );
      return { data: true, error: null };
    }

    try {
      const audit = audits.find((a) => a.id === id);
      if (!audit) return { data: null, error: 'Audit introuvable' };

      const updatedPhotos = [...(audit.photos || []), photoUrl];
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
    addPhotoToAudit,
    refetch: fetchAudits,
  };
}
