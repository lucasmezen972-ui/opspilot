import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { supabase, type Profile } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  loading: boolean;
  authError: string | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ data: any; error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (
    updates: Partial<Profile>,
  ) => Promise<{ data: any; error: any }>;
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
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
        if (s?.user?.id) {
          fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
      }
    });
    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setAuthError(mapSupabaseError('sign in error', error));
    }
    setLoading(false);
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setAuthError(null);
    setLoading(true);
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
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(mapSupabaseError('sign out error', error));
    return { error };
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
    return { data, error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: 'Utilisateur non connecté' };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
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
