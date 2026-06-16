import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  isUploadableEvidenceUri,
  uploadEvidencePhoto,
} from '../../../features/evidence/evidenceUpload';

const uploadMock = vi.fn();
const insertMock = vi.fn();

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    storage: { from: () => ({ upload: uploadMock }) },
    from: () => ({ insert: insertMock }),
  },
}));

beforeEach(() => {
  uploadMock.mockReset();
  insertMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
  global.fetch = vi.fn().mockResolvedValue({
    blob: async () => ({ type: 'image/jpeg' }),
  }) as unknown as typeof fetch;
});

describe('isUploadableEvidenceUri', () => {
  it('reconnaît les URI locales et ignore les URL distantes', () => {
    expect(isUploadableEvidenceUri('file:///tmp/x.jpg')).toBe(true);
    expect(isUploadableEvidenceUri('blob:http://localhost/abc')).toBe(true);
    expect(isUploadableEvidenceUri('content://media/1')).toBe(true);
    expect(isUploadableEvidenceUri('https://cdn/x.jpg')).toBe(false);
    expect(isUploadableEvidenceUri('data:image/png;base64,zzz')).toBe(false);
    expect(isUploadableEvidenceUri(null)).toBe(false);
  });
});

describe('uploadEvidencePhoto', () => {
  it('téléverse et retourne un chemin cloisonné par organisation', async () => {
    uploadMock.mockResolvedValue({ error: null });
    const path = await uploadEvidencePhoto({
      organizationId: 'org-1',
      entityType: 'audit',
      entityId: 'a-1',
      uri: 'file:///tmp/x.jpg',
      uploadedBy: 'user-1',
    });
    expect(path).toMatch(/^org-1\/audit\/a-1\/\d+-preuve\.jpg$/);
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it('retourne null sans tracer si le téléversement échoue (best-effort)', async () => {
    uploadMock.mockResolvedValue({ error: { message: 'fail' } });
    const path = await uploadEvidencePhoto({
      organizationId: 'org-1',
      entityType: 'audit',
      entityId: 'a-1',
      uri: 'file:///tmp/x.jpg',
    });
    expect(path).toBeNull();
    expect(insertMock).not.toHaveBeenCalled();
  });
});
