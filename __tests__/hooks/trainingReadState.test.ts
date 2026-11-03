import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  profile: { id: 'actor-a', organization_id: 'org-a' },
  deferred: null as null | {
    promise: Promise<unknown>;
    resolve: (value: unknown) => void;
  },
  failTable: '',
}));
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    profile: fixture.profile,
    fetchProfile: vi.fn(),
    updateProfile: vi.fn(),
    isDemoMode: false,
    session: {},
  }),
}));
vi.mock('../../lib/demoStore', () => ({
  useDemoCollection: () => [],
  getDemoState: () => ({ trainings: [] }),
  updateDemoCollection: vi.fn(),
}));
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      const actor = { ...fixture.profile };
      const query = {
        select: () => query,
        eq: () => query,
        in: () => query,
        order: () => query,
        then: (
          resolve: (value: unknown) => unknown,
          reject: (reason: unknown) => unknown,
        ) => {
          if (
            table === 'trainings' &&
            actor.id === 'actor-a' &&
            fixture.deferred
          )
            return fixture.deferred.promise.then(resolve, reject);
          const result =
            fixture.failTable === table
              ? { data: null, error: { message: 'Lecture indisponible' } }
              : {
                  data:
                    table === 'trainings'
                      ? [
                          {
                            id: `course-${actor.id}`,
                            organization_id: actor.organization_id,
                            title: 'Fictif',
                          },
                        ]
                      : [],
                  error: null,
                };
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return query;
    },
  },
}));
import { useTraining } from '../../hooks/useTraining';

describe('lecture des formations et changement de compte', () => {
  beforeEach(() => {
    fixture.profile = { id: 'actor-a', organization_id: 'org-a' };
    fixture.deferred = null;
    fixture.failTable = '';
  });
  it('écarte une réponse tardive du compte précédent et masque ses cours au changement', async () => {
    let resolve!: (value: unknown) => void;
    const promise = new Promise((r) => {
      resolve = r;
    });
    fixture.deferred = { promise, resolve };
    const { result, rerender } = renderHook(() => useTraining());
    fixture.profile = { id: 'actor-b', organization_id: 'org-b' };
    rerender();
    expect(result.current.courses).toEqual([]);
    await waitFor(() =>
      expect(result.current.courses[0]?.id).toBe('course-actor-b'),
    );
    await act(async () =>
      resolve({ data: [{ id: 'late-private-course' }], error: null }),
    );
    expect(result.current.courses.map((c) => c.id)).toEqual(['course-actor-b']);
  });
  it('ne confirme pas un rafraîchissement si les chapitres n’ont pas été chargés', async () => {
    const { result } = renderHook(() => useTraining());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.courses[0]?.id).toBe('course-actor-a');
    fixture.failTable = 'training_chapters';
    let loaded: unknown;
    await act(async () => {
      loaded = await result.current.refetch();
    });
    expect(loaded).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
  it('refuse un ancien rappel de rafraîchissement après le changement de compte', async () => {
    const { result, rerender } = renderHook(() => useTraining());
    await waitFor(() =>
      expect(result.current.courses[0]?.id).toBe('course-actor-a'),
    );
    const previousRefresh = result.current.refetch;
    fixture.profile = { id: 'actor-b', organization_id: 'org-b' };
    rerender();
    await waitFor(() =>
      expect(result.current.courses[0]?.id).toBe('course-actor-b'),
    );
    let loaded: unknown;
    await act(async () => {
      loaded = await previousRefresh();
    });
    expect(loaded).toBeNull();
    expect(result.current.courses.map((c) => c.id)).toEqual(['course-actor-b']);
  });
});
