import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { supabase, type Profile } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

const AUTH_TIMEOUT_MS = 10_000;
const OFFLINE_MSG =
  'Connexion temporairement indisponible. Vérifiez votre réseau.';

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  loading: boolean;
  authError: string | null;
  isOffline: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: any; error: any }>;
  fetchProfile: (userId: string) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) setProfile(data);
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await withTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT_MS,
          { data: { session: null }, error: null } as any,
        );
        const s = result?.data?.session ?? null;
        if (!cancelled) {
          setSession(s);
          setUser(s?.user ?? null);
          setIsOffline(false);
        }
        if (s?.user?.id && !cancelled) {
          await fetchProfile(s.user.id);
        }
      } catch (error) {
        if (!cancelled) {
          setIsOffline(true);
          mapSupabaseError('Auth initialization error', error);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    let sub:
      | ReturnType<typeof supabase.auth.onAuthStateChange>['data']
      | undefined;
    try {
      const result = supabase.auth.onAuthStateChange((_e, s) => {
        if (!cancelled) {
          setSession(s ?? null);
          setUser(s?.user ?? null);
          setIsOffline(false);
          if (s?.user?.id) {
            fetchProfile(s.user.id).catch((error) => {
              mapSupabaseError('Profile fetch error', error);
            });
          } else {
            setProfile(null);
          }
        }
      });
      sub = result.data;
    } catch (error) {
      if (!cancelled) setIsOffline(true);
    }

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_TIMEOUT_MS,
        {
          data: null,
          error: { message: OFFLINE_MSG },
        } as any,
      );
      if (error) {
        const msg = error.message === OFFLINE_MSG
          ? OFFLINE_MSG
          : mapSupabaseError('sign in error', error);
        setAuthError(msg);
        if (error.message === OFFLINE_MSG) setIsOffline(true);
        return { data: null, error };
      }
      setIsOffline(false);
      return { data, error: null };
    } catch (e: any) {
      setAuthError(OFFLINE_MSG);
      setIsOffline(true);
      return { data: null, error: { message: OFFLINE_MSG } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        }),
        AUTH_TIMEOUT_MS,
        { data: null, error: { message: OFFLINE_MSG } } as any,
      );
      if (error) setAuthError(mapSupabaseError('sign up error', error));
      return { data, error };
    } catch (e: any) {
      setAuthError(OFFLINE_MSG);
      return { data: null, error: { message: OFFLINE_MSG } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setAuthError(mapSupabaseError('sign out error', error));
      setProfile(null);
      setSession(null);
      setUser(null);
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: 'Utilisateur non connecté' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (!error && data) setProfile(data);
      return { data, error };
    } catch (e: any) {
      return { data: null, error: e };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        ready,
        loading,
        authError,
        isOffline,
        signIn,
        signUp,
        signOut,
        updateProfile,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
