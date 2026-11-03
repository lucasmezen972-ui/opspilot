import catalogue from './internalProgramCatalogue.json';
import type { TrainingProgramMetadata } from '../../lib/supabase';

/** Metadata only: neither lessons nor the private graded answer bank is bundled. */
export const internalProgramCatalogue = catalogue as TrainingProgramMetadata[];

export function programRequirementLabel(
  requirement: TrainingProgramMetadata['requirement'],
): string {
  if (requirement === 'internal_required')
    return 'Obligation interne selon le poste';
  if (requirement === 'role_required') return 'Hygiène selon les missions';
  return 'Développement professionnel';
}

export function formatVideoDuration(seconds: number): string {
  const rounded = Math.round(Math.max(0, seconds));
  return `${Math.floor(rounded / 60)} min ${String(rounded % 60).padStart(2, '0')} s`;
}

export function isProgramCatalogue(
  value: unknown,
): value is TrainingProgramMetadata[] {
  return (
    Array.isArray(value) &&
    value.every(
      (p) =>
        p &&
        typeof p === 'object' &&
        typeof p.key === 'string' &&
        typeof p.version === 'string' &&
        typeof p.title === 'string' &&
        typeof p.summary === 'string' &&
        typeof p.applicability === 'string' &&
        typeof p.onsite === 'string' &&
        typeof p.audience === 'string' &&
        typeof p.prerequisites === 'string' &&
        typeof p.category === 'string' &&
        ['internal_required', 'role_required', 'professional'].includes(
          p.requirement,
        ) &&
        Number.isFinite(p.video_seconds) &&
        p.video_seconds > 0 &&
        Number.isFinite(p.reading_minutes) &&
        Number.isFinite(p.activity_minutes) &&
        Array.isArray(p.objectives) &&
        p.objectives.every((x: unknown) => typeof x === 'string') &&
        Array.isArray(p.positioning) &&
        p.positioning.every((x: unknown) => typeof x === 'string') &&
        Array.isArray(p.sources) &&
        p.sources.every(
          (s: { url?: unknown; label?: unknown }) =>
            typeof s?.label === 'string' &&
            typeof s?.url === 'string' &&
            s.url.startsWith('https://'),
        ) &&
        Array.isArray(p.video_chapters) &&
        p.video_chapters.every(
          (c: { title?: unknown; seconds?: unknown }) =>
            typeof c?.title === 'string' &&
            typeof c.seconds === 'number' &&
            Number.isFinite(c.seconds) &&
            c.seconds >= 0 &&
            c.seconds < p.video_seconds,
        ) &&
        !('quiz' in p) &&
        !('chapters' in p) &&
        !('correct_index' in p),
    )
  );
}
