export type SupabaseConfigStatus = 'valid' | 'missing' | 'placeholder';

export interface SupabaseConfigResult {
  status: SupabaseConfigStatus;
  url?: string;
}

export const getSupabaseConfigStatus = (): SupabaseConfigResult => {
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return { status: 'missing' };
  if (url === 'https://placeholder.supabase.co')
    return { status: 'placeholder' };
  return { status: 'valid', url };
};

export const isSupabaseConfigured = (): boolean =>
  getSupabaseConfigStatus().status === 'valid';

// Test accounts pour développement
export const getTestAccounts = () => [
  {
    email: 'demo@opspilot.com',
    password: 'demo123',
    name: 'Utilisateur Demo',
    role: 'employee',
  },
  {
    email: 'marie.dupont@opspilot.com',
    password: 'marie123',
    name: 'Marie Dupont',
    role: 'manager',
  },
];

export const isTestAccount = (email: string): boolean => {
  return getTestAccounts().some((account) => account.email === email);
};
