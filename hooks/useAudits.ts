import { useEffect, useState } from 'react';

import { useAuth } from './useAuth';
import { scheduleAuditReminder } from './usePushNotifications';
import { supabase, type Audit } from '../lib/supabase';

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.organization_id) {
      fetchAudits();
    }
  }, [profile]);

  const fetchAudits = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audits')
        .select(
          `
          *,
          profiles(full_name),
          stores(name)
        `,
        )
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des audits:', error);
        return;
      }

      setAudits(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAudit = async (auditData: {
    title: string;
    description?: string;
    location?: string;
    due_date?: string;
  }) => {
    if (!profile?.organization_id || !profile?.store_id)
      return { error: 'Organisation ou magasin non défini' };

    try {
      const { data, error } = await supabase
        .from('audits')
        .insert({
          ...auditData,
          organization_id: profile.organization_id,
          store_id: profile.store_id,
          auditor_id: profile.id,
          status: 'pending',
          max_score: 100,
          issues_count: 0,
          photos: [],
        })
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de la création de l'audit:", error);
        return { error };
      }

      setAudits([data, ...audits]);
      if (auditData.due_date) {
        await scheduleAuditReminder(
          auditData.title,
          new Date(auditData.due_date),
        );
      }
      return { data };
    } catch (error) {
      console.error('Erreur:', error);
      return { error };
    }
  };

  const updateAuditStatus = async (
    auditId: string,
    status: Audit['status'],
    additionalData?: Partial<Audit>,
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      if (status === 'in_progress' && !additionalData?.started_at) {
        updateData.started_at = new Date().toISOString();
      }

      if (status === 'completed' && !additionalData?.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('audits')
        .update(updateData)
        .eq('id', auditId)
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de la mise à jour de l'audit:", error);
        return { error };
      }

      // Mettre à jour la liste locale
      setAudits(audits.map((a) => (a.id === auditId ? data : a)));

      // Mettre à jour les stats du profil si l'audit est terminé
      if (status === 'completed' && profile) {
        await updateProfileStats();
      }

      return { data };
    } catch (error) {
      console.error('Erreur:', error);
      return { error };
    }
  };

  const updateProfileStats = async () => {
    if (!profile) return;

    try {
      const { data: completedAudits } = await supabase
        .from('audits')
        .select('score')
        .eq('auditor_id', profile.id)
        .eq('status', 'completed');

      if (completedAudits && completedAudits.length > 0) {
        const totalAudits = completedAudits.length;
        const avgScore =
          completedAudits
            .filter((a) => a.score !== null)
            .reduce((sum, a) => sum + (a.score || 0), 0) / totalAudits;

        await supabase
          .from('profiles')
          .update({
            total_audits: totalAudits,
            avg_score: Math.round(avgScore * 100) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des stats:', error);
    }
  };

  const addPhotoToAudit = async (auditId: string, photoUrl: string) => {
    const audit = audits.find((a) => a.id === auditId);
    if (!audit) return { error: 'Audit non trouvé' };

    try {
      const updatedPhotos = [...audit.photos, photoUrl];

      const { data, error } = await supabase
        .from('audits')
        .update({
          photos: updatedPhotos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', auditId)
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de l'ajout de la photo:", error);
        return { error };
      }

      setAudits(audits.map((a) => (a.id === auditId ? data : a)));
      return { data };
    } catch (error) {
      console.error('Erreur:', error);
      return { error };
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
