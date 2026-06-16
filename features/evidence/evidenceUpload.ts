import { supabase } from '../../lib/supabase';
import {
  EVIDENCE_BUCKET,
  buildEvidenceStoragePath,
  type EvidenceEntityType,
} from './evidenceStorage';

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
  return /^(file:|blob:|content:)/i.test(uri);
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
 * Best-effort : retourne le chemin de stockage, ou null en cas d'échec
 * (l'appelant conserve alors l'URI d'origine sans bloquer la clôture).
 */
export async function uploadEvidencePhoto(
  input: UploadEvidenceInput,
): Promise<string | null> {
  try {
    const response = await fetch(input.uri);
    const blob = await response.blob();
    const contentType = blob.type || 'image/jpeg';
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
    if (uploadError) return null;

    // Traçabilité (best-effort) : un échec d'insert ne perd pas le fichier.
    await supabase.from('evidence_files').insert({
      organization_id: input.organizationId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      storage_path: path,
      uploaded_by: input.uploadedBy ?? null,
    });

    return path;
  } catch {
    return null;
  }
}
