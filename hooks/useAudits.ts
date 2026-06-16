import { useEffect, useState, useCallback } from 'react';

import { useAuth } from './useAuth';
import { signaturesForAudit } from '../features/audits/auditSignatureModel';
import type { AuditResponseDraft } from '../features/audits/scoring';
import {
  isUploadableEvidenceUri,
  uploadEvidencePhoto,
} from '../features/evidence/evidenceUpload';
import { demoId } from '../lib/demoData';
import { updateDemoCollection, useDemoCollection } from '../lib/demoStore';
import {
  supabase,
  type Audit,
  type AuditResponse,
  type AuditSignature,
} from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useAudits() {
  const [remoteAudits, setRemoteAudits] = useState<Audit[]>([]);
  const [remoteSignatures, setRemoteSignatures] = useState<AuditSignature[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const { user, profile, isDemoMode, session } = useAuth();

  // Mode démo local (Supabase injoignable) : store partagé entre écrans.
  const isLocalDemo = isDemoMode && !session;
  const demoAudits = useDemoCollection('audits');
  const demoResponses = useDemoCollection('auditResponses');
  const demoSignatures = useDemoCollection('auditSignatures');
  const signatures = isLocalDemo ? demoSignatures : remoteSignatures;
  const audits = isLocalDemo ? demoAudits : remoteAudits;
  const setAudits = isLocalDemo
    ? (updater: (prev: Audit[]) => Audit[]) =>
        updateDemoCollection('audits', updater)
    : setRemoteAudits;

  const fetchAudits = useCallback(async () => {
    if (isLocalDemo) {
      // Le store démo est déjà alimenté (et partagé) : rien à charger.
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

      setRemoteAudits(data || []);

      const { data: sigData } = await supabase
        .from('audit_signatures')
        .select('*')
        .eq('organization_id', profile.organization_id);
      setRemoteSignatures((sigData ?? []) as AuditSignature[]);
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
        template_id: auditData.template_id ?? null,
        template_version: auditData.template_version ?? null,
        auditor_id: user.id,
        title: auditData.title ?? '',
        description: auditData.description ?? null,
        location: auditData.location ?? null,
        status: auditData.status ?? 'pending',
        score: auditData.score ?? null,
        max_score: auditData.max_score ?? 100,
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
          title: auditData.title ?? '',
          description: auditData.description ?? null,
          location: auditData.location ?? null,
          status: auditData.status ?? 'pending',
          max_score: auditData.max_score ?? 100,
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
    responses: AuditResponseDraft[] = [],
  ) => {
    const updates: Record<string, any> = {
      status: 'completed',
      score,
      issues_count: issuesCount,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLocalDemo) {
      const now = new Date().toISOString();
      const savedResponses: AuditResponse[] = responses.map((response) => ({
        id:
          demoResponses.find(
            (existing) =>
              existing.audit_id === id && existing.item_id === response.item_id,
          )?.id ?? demoId('demo-audit-response'),
        audit_id: id,
        item_id: response.item_id,
        value: response.value,
        is_compliant: response.is_compliant,
        photo_url: response.photo_url ?? null,
        comment: response.comment ?? null,
        created_at: now,
      }));
      if (savedResponses.length > 0) {
        updateDemoCollection('auditResponses', (current) => [
          ...current.filter(
            (existing) =>
              !savedResponses.some(
                (saved) =>
                  saved.audit_id === existing.audit_id &&
                  saved.item_id === existing.item_id,
              ),
          ),
          ...savedResponses,
        ]);
      }

      let updated: Audit | null = null;
      setAudits((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          updated = { ...a, ...updates } as Audit;
          return updated;
        }),
      );
      return { data: updated, responses: savedResponses, error: null };
    }

    try {
      // Production : téléverse les preuves photo locales dans le bucket privé
      // « evidence » (cloisonné par organisation) et remplace l'URI locale par
      // le chemin de stockage persistant. Best-effort, ne bloque pas la clôture.
      let responsesToSave = responses;
      const orgId = profile?.organization_id;
      if (orgId) {
        responsesToSave = await Promise.all(
          responses.map(async (response) => {
            if (!isUploadableEvidenceUri(response.photo_url)) return response;
            const storagePath = await uploadEvidencePhoto({
              organizationId: orgId,
              entityType: 'audit',
              entityId: id,
              uri: response.photo_url as string,
              uploadedBy: user?.id ?? null,
            });
            return storagePath
              ? { ...response, photo_url: storagePath }
              : response;
          }),
        );
      }

      let savedResponses: AuditResponse[] = [];
      if (responsesToSave.length > 0) {
        const { data: responseData, error: responseError } = await supabase
          .from('audit_responses')
          .upsert(
            responsesToSave.map((response) => ({
              audit_id: id,
              item_id: response.item_id,
              value: response.value,
              is_compliant: response.is_compliant,
              photo_url: response.photo_url ?? null,
              comment: response.comment ?? null,
            })),
            { onConflict: 'audit_id,item_id' },
          )
          .select();
        if (responseError) {
          return {
            data: null,
            responses: [],
            error: mapSupabaseError(
              "Erreur lors de l'enregistrement des réponses",
              responseError,
            ),
          };
        }
        savedResponses = (responseData || []) as AuditResponse[];
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
          responses: savedResponses,
          error: mapSupabaseError(
            "Erreur lors de la clôture de l'audit",
            error,
          ),
        };
      }
      setAudits((prev) => prev.map((a) => (a.id === id ? data : a)));
      return { data, responses: savedResponses, error: null };
    } catch (error) {
      return {
        data: null,
        responses: [],
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

  /** Réponses enregistrées d'un audit (détail par critère, pour le rapport). */
  const getAuditResponses = useCallback(
    async (auditId: string): Promise<AuditResponse[]> => {
      if (isLocalDemo) {
        return demoResponses.filter((r) => r.audit_id === auditId);
      }
      try {
        const { data, error } = await supabase
          .from('audit_responses')
          .select('*')
          .eq('audit_id', auditId);
        if (error) {
          mapSupabaseError(
            'Erreur lors de la récupération des réponses',
            error,
          );
          return [];
        }
        return data ?? [];
      } catch (error) {
        mapSupabaseError('Erreur getAuditResponses', error);
        return [];
      }
    },
    [isLocalDemo, demoResponses],
  );

  const getSignaturesForAudit = useCallback(
    (auditId: string) => signaturesForAudit(signatures, auditId),
    [signatures],
  );

  /** Sign-off d'un audit clôturé (auditeur ou responsable), une fois par rôle. */
  const signAudit = async (
    auditId: string,
    signerName: string,
    signerRole: AuditSignature['signer_role'],
  ) => {
    if (
      signaturesForAudit(signatures, auditId).some(
        (s) => s.signer_role === signerRole,
      )
    ) {
      return { data: null, error: null };
    }
    const now = new Date().toISOString();
    const signature: AuditSignature = {
      id: demoId('audit-sig'),
      organization_id: profile?.organization_id ?? '',
      audit_id: auditId,
      signer_id: profile?.id ?? null,
      signer_name: signerName,
      signer_role: signerRole,
      signed_at: now,
    };

    if (isLocalDemo) {
      updateDemoCollection('auditSignatures', (prev) => [...prev, signature]);
      return { data: signature, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('audit_signatures')
        .insert({
          organization_id: signature.organization_id,
          audit_id: auditId,
          signer_id: signature.signer_id,
          signer_name: signerName,
          signer_role: signerRole,
        })
        .select()
        .single();
      if (error) {
        return {
          data: null,
          error: mapSupabaseError('Erreur signature', error),
        };
      }
      setRemoteSignatures((prev) => [...prev, data as AuditSignature]);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: mapSupabaseError('Erreur signAudit', error) };
    }
  };

  return {
    audits,
    loading,
    signatures,
    createAudit,
    updateAuditStatus,
    completeAudit,
    addPhotoToAudit,
    getAuditResponses,
    getSignaturesForAudit,
    signAudit,
    refetch: fetchAudits,
  };
}
