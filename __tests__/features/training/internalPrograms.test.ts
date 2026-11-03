import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  formatVideoDuration,
  internalProgramCatalogue,
  isProgramCatalogue,
  programRequirementLabel,
} from '../../../features/training/internalPrograms';

describe('parcours internes : périmètre et données visibles', () => {
  it('ne publie aucun corrigé noté dans les sources pédagogiques du dépôt', () => {
    const dir = resolve('content/training-programs');
    for (const file of readdirSync(dir).filter((p) => p.endsWith('.json'))) {
      const p = JSON.parse(readFileSync(resolve(dir, file), 'utf8'));
      for (const q of p.quiz) {
        expect(q).not.toHaveProperty('correct_index');
        expect(q).not.toHaveProperty('correct_indexes');
      }
    }
  });
  it('offre les familles internes avec leurs conditions et pratiques, sans cours d’organisme', () => {
    expect(isProgramCatalogue(internalProgramCatalogue)).toBe(true);
    const required = internalProgramCatalogue.filter(
      (p) => p.requirement === 'internal_required',
    );
    expect(required.map((p) => p.key)).toEqual(
      expect.arrayContaining([
        'accueil-securite',
        'incendie-evacuation',
        'manutention',
        'materiels-produits',
        'hygiene-alimentaire',
      ]),
    );
    for (const p of internalProgramCatalogue) {
      expect(p.onsite.length).toBeGreaterThan(60);
      expect(p.objectives.length).toBeGreaterThanOrEqual(3);
      expect(p.video_seconds).toBeGreaterThan(60);
      expect(p.title).not.toMatch(
        /Qualiopi|déclaration d’activité|organisme habilité/i,
      );
    }
    expect(programRequirementLabel('professional')).toBe(
      'Développement professionnel',
    );
  });
  it('refuse un catalogue connecté incomplet ou contenant le corrigé', () => {
    expect(isProgramCatalogue(null)).toBe(false);
    expect(
      isProgramCatalogue([
        { ...internalProgramCatalogue[0], quiz: [{ correct_index: 1 }] },
      ]),
    ).toBe(false);
    expect(
      isProgramCatalogue([
        {
          ...internalProgramCatalogue[0],
          sources: [{ label: 'Source', url: 'data:text/html,test' }],
        },
      ]),
    ).toBe(false);
    expect(
      isProgramCatalogue([
        { ...internalProgramCatalogue[0], video_seconds: NaN },
      ]),
    ).toBe(false);
    expect(
      isProgramCatalogue([
        {
          ...internalProgramCatalogue[0],
          video_chapters: [{ title: 'Hors vidéo', seconds: 99999 }],
        },
      ]),
    ).toBe(false);
  });
  it('affiche la durée vidéo mesurée distinctement des estimations', () => {
    expect(formatVideoDuration(135.4)).toBe('2 min 15 s');
    expect(formatVideoDuration(59.9)).toBe('1 min 00 s');
  });
});
