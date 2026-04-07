import { useEffect, useState, useCallback } from 'react';
import { supabase, isDemoMode, type Audit } from '../lib/supabase';
import { useAuth } from './useAuth';
import { mapSupabaseError } from '../utils/error';

const DEMO_AUDITS: Audit[] = [
  {
    id: 'demo-audit-1',
    organization_id: 'demo-org-001',
    store_id: 'demo-store-001',
    auditor_id: 'demo-user-001',
    title: 'Audit rayon frais',
    description: 'Contrôle qualité du rayon frais - températures et DLC',
    location: 'Magasin Centre-Ville',
    status: 'completed',
    score: 92,
    max_score: 100,
    issues_count: 1,
    photos: [],
    notes: 'Bon état général, une température légèrement élevée en vitrine 3',
    started_at: '2024-01-15T08:00:00Z',
    completed_at: '2024-01-15T09:30:00Z',
    due_date: '2024-01-15T18:00:00Z',
    created_at: '2024-01-15T07:00:00Z',
    updated_at: '2024-01-15T09:30:00Z',
  },
  {
    id: 'demo-audit-2',
    organization_id: 'demo-org-001',
    store_id: 'demo-store-001',
    auditor_id: 'demo-user-001',
    title: 'Audit sécurité magasin',
    description: 'Vérification des équipements de sécurité et issues de secours',
    location: 'Magasin Centre-Ville',
    status: 'in_progress',
    score: null,
    max_score: 100,
    issues_count: 3,
    photos: [],
    notes: null,
    started_at: '2024-01-16T10:00:00Z',
    completed_at: null,
    due_date: '2024-01-17T18:00:00Z',
    created_at: '2024-01-16T09:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'demo-audit-3',
    organization_id: 'demo-org-001',
    store_id: 'demo-store-001',
    auditor_id: 'demo-user-001',
    title: 'Audit hygiène cuisine',
    description: 'Contrôle HACCP de la zone de préparation',
    location: 'Restaurant Niveau -1',
    status: 'pending',
    score: null,
    max_score: 100,
    issues_count: 0,
    photos: [],
    notes: null,
    started_at: null,
    completed_at: null,
    due_date: '2024-01-20T18:00:00Z',
    created_at: '2024-01-14T12:00:00Z',
    updated_at: '2024-01-14T12:00:00Z',
  },
];

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>(isDemoMode ? DEMO_AUDITS : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const { user, profile } = useAuth();

  const fetchAudits = useCallback(async () => {
    if (isDemoMode) {
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
  }, [profile?.organization_id]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const createAudit = async (auditData: Partial<Audit>) => {
    if (!user || !profile?.organization_id) {
      return { data: null, error: 'Utilisateur non connecté' };
    }

    if (isDemoMode) {
      const newAudit: Audit = {
        id: `demo-audit-${Date.now()}`,
        organization_id: profile.organization_id,
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
        return { data: null, error: mapSupabaseError('Erreur lors de la création de l\'audit', error) };
      }

      setAudits((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur createAudit', error) };
    }
  };

  const updateAuditStatus = async (id: string, status: string) => {
    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (status === 'in_progress' && !audits.find((a) => a.id === id)?.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    if (isDemoMode) {
      setAudits((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
      return { data: { id, ...updates }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('audits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: mapSupabaseError('Erreur lors de la mise à jour du statut', error) };
      }

      setAudits((prev) => prev.map((a) => (a.id === id ? data : a)));
      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur updateAuditStatus', error) };
    }
  };

  const addPhotoToAudit = async (id: string, photoUrl: string) => {
    const audit = audits.find((a) => a.id === id);
    if (!audit) return { data: null, error: 'Audit introuvable' };

    const updatedPhotos = [...(audit.photos || []), photoUrl];

    if (isDemoMode) {
      const updated = { ...audit, photos: updatedPhotos, updated_at: new Date().toISOString() };
      setAudits((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return { data: updated, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('audits')
        .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: mapSupabaseError('Erreur lors de l\'ajout de la photo', error) };
      }

      setAudits((prev) => prev.map((a) => (a.id === id ? data : a)));
      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur addPhotoToAudit', error) };
    }
  };

  return { audits, loading, createAudit, updateAuditStatus, addPhotoToAudit, refetch: fetchAudits };
}
