import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { supabase, type Audit } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const fetchAudits = useCallback(async () => {
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
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const createAudit = async (auditData: Partial<Audit>) => {
    if (!user || !profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
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

  const addPhotoToAudit = async (id: string, photoUrl: string) => {
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
