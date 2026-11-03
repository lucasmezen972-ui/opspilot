import {
  EVIDENCE_BUCKET,
  buildEvidenceStoragePath,
  type EvidenceEntityType,
} from './evidenceStorage';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

/**
 * Téléversement réel des preuves photo vers le bucket privé « evidence »
 * (production uniquement). En mode démo / E2E, l'appelant n'invoque jamais ces
 * fonctions (le flux reste en mémoire), donc aucun réseau n'est touché.
 */

/** Une URI locale (appareil / navigateur) est téléversable ; pas une URL distante. */
export function isUploadableEvidenceUri(
  uri: string | null | undefined,
): boolean {
  if (!uri) return false;
  return /^(file:|blob:|content:|data:image\/(?:jpeg|png|webp);base64,)/i.test(
    uri,
  );
}

export interface UploadEvidenceInput {
  organizationId: string;
  entityType: EvidenceEntityType;
  entityId: string;
  uri: string;
  uploadedBy?: string | null;
  fileName?: string;
}

/**
 * Téléverse une preuve photo et trace le fichier dans evidence_files.
 * Retourne le chemin durable, ou null en cas d'échec. L'appelant doit
 * refuser la clôture si une photo fournie n'a pas été enregistrée.
 */
export async function uploadEvidencePhoto(
  input: UploadEvidenceInput,
): Promise<string | null> {
  try {
    const response = await fetch(input.uri);
    if (response.ok === false) return null;
    const blob = await response.blob();
    const contentType = blob.type || 'image/jpeg';
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(contentType) ||
      blob.size > 10 * 1024 * 1024
    )
      return null;
    const extension = contentType.includes('png') ? 'png' : 'jpg';
    const fileName = input.fileName ?? `preuve.${extension}`;

    const path = buildEvidenceStoragePath({
      organizationId: input.organizationId,
      entityType: input.entityType,
      entityId: input.entityId,
      fileName,
    });

    const { error: uploadError } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .upload(path, blob, { contentType, upsert: false });
    if (uploadError) {
      logger.error('Evidence upload failed', uploadError);
      return null;
    }

    // Traçabilité (best-effort) : un échec d'insert ne perd pas le fichier.
    await supabase.from('evidence_files').insert({
      organization_id: input.organizationId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      storage_path: path,
      uploaded_by: input.uploadedBy ?? null,
    });

    return path;
  } catch (err) {
    logger.error('Evidence upload exception', err);
    return null;
  }
}
