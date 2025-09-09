import { useEffect, useState } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { mapSupabaseError } from '../utils/error';

export function useAuth() {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(mapSupabaseError('sign in error', error));
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
    if (!user) return { error: 'Utilisateur non connecté' };
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
