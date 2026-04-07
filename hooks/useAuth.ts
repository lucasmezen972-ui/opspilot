import { useEffect, useState } from 'react';
import { supabase, isDemoMode, type Profile } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { mapSupabaseError } from '../utils/error';
import { getTestAccounts } from '../utils/supabaseConfig';

const DEMO_PROFILE: Profile = {
  id: 'demo-user-001',
  organization_id: 'demo-org-001',
  store_id: 'demo-store-001',
  email: 'demo@opspilot.com',
  full_name: 'Marie Dupont',
  phone: '+33 6 12 34 56 78',
  avatar_url: null,
  role: 'manager',
  department_id: null,
  level: 4,
  xp: 850,
  total_audits: 24,
  avg_score: 87,
  completed_trainings: 8,
  active_time_hours: 156,
  last_active: new Date().toISOString(),
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled) {
          setSession(session ?? null);
          setUser(session?.user ?? null);
        }
        if (session?.user?.id && !cancelled) {
          await fetchProfile(session.user.id);
        }
        if (!cancelled) setReady(true);
      } catch (error) {
        mapSupabaseError('Auth initialization error', error);
        if (!cancelled) setReady(true);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!cancelled) {
        setSession(s ?? null);
        setUser(s?.user ?? null);
      }
    });
    return () => { cancelled = true; sub?.subscription?.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    setLoading(true);
    console.log('[Auth] Tentative de connexion pour:', email);

    if (isDemoMode) {
      const testAccounts = getTestAccounts();
      const account = testAccounts.find(a => a.email === email && a.password === password);
      if (account) {
        const demoUser = { id: 'demo-user-001', email: account.email } as User;
        const demoProfile: Profile = {
          ...DEMO_PROFILE,
          email: account.email,
          full_name: account.name,
          role: account.role as Profile['role'],
        };
        setUser(demoUser);
        setProfile(demoProfile);
        console.log('[Auth] Connexion démo réussie pour:', email);
        setLoading(false);
        return { data: { user: demoUser, session: null }, error: null };
      } else {
        const error = { message: 'Email ou mot de passe incorrect' };
        setAuthError(error.message);
        console.error('[Auth] Erreur de connexion démo:', error.message);
        setLoading(false);
        return { data: { user: null, session: null }, error };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[Auth] Erreur de connexion:', error.message);
      setAuthError(mapSupabaseError('sign in error', error));
    } else {
      console.log('[Auth] Connexion réussie pour:', email);
    }
    setLoading(false);
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setAuthError(null);
    setLoading(true);

    if (isDemoMode) {
      const demoUser = { id: 'demo-user-new', email } as User;
      const demoProfile: Profile = {
        ...DEMO_PROFILE,
        id: 'demo-user-new',
        email,
        full_name: fullName,
        role: 'employee',
        level: 1,
        xp: 0,
        total_audits: 0,
        avg_score: 0,
        completed_trainings: 0,
        active_time_hours: 0,
      };
      setUser(demoUser);
      setProfile(demoProfile);
      setLoading(false);
      return { data: { user: demoUser, session: null }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) setAuthError(mapSupabaseError('sign up error', error));
    setLoading(false);
    return { data, error };
  };

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null);
      setProfile(null);
      setSession(null);
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(mapSupabaseError('sign out error', error));
    return { error };
  };

  const fetchProfile = async (userId: string) => {
    if (isDemoMode) {
      return { data: DEMO_PROFILE, error: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
    return { data, error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Utilisateur non connecté' };

    if (isDemoMode) {
      const updated = { ...profile, ...updates } as Profile;
      setProfile(updated);
      return { data: updated, error: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  };

  return { session, user, profile, ready, loading, authError, signIn, signUp, signOut, updateProfile, fetchProfile };
}
