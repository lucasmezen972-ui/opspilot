export type SupabaseConfigStatus = 'valid' | 'missing' | 'placeholder';

export interface SupabaseConfigResult {
  status: SupabaseConfigStatus;
  url?: string;
}

export const getSupabaseConfigStatus = (): SupabaseConfigResult => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) return { status: 'missing' };
  if (url === 'https://placeholder.supabase.co')
    return { status: 'placeholder' };
  return { status: 'valid', url };
};

export const isSupabaseConfigured = (): boolean =>
  getSupabaseConfigStatus().status === 'valid';
