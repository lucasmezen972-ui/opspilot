import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { mapSupabaseError } from '../utils/error';
interface AuthError extends Error {
  message: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  loading: boolean;
  authError: string | null;
}


export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        console.log('[Auth] Initializing authentication...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mountedRef.current) {
          setSession(session ?? null);
          setUser(session?.user ?? null);
          console.log('[Auth] Session loaded:', session ? 'authenticated' : 'anonymous');
        }
        
        if (session?.user?.id && mountedRef.current) {
          await fetchProfile(session.user.id);
        }
        
        if (mountedRef.current) {
          setReady(true);
          console.log('[Auth] Authentication ready');
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        if (mountedRef.current) {
          setReady(true);
          setAuthError(error instanceof Error ? error.message : 'Authentication initialization failed');
        }
      }
    })();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event, session ? 'authenticated' : 'anonymous');
      
      if (mountedRef.current) {
        setSession(s ?? null);
        setUser(s?.user ?? null);
        
        // Fetch profile when user signs in
        if (event === 'SIGNED_IN' && session?.user?.id) {
          await fetchProfile(session.user.id);
        }
        
        // Clear profile when user signs out
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setAuthError(null);
        }
      }
    });

    return () => { 
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password?.trim()) {
      const error = 'Email et mot de passe requis';
      setAuthError(error);
      return { data: null, error: { message: error } };
    }

    setAuthError(null);
    setLoading(true);

    try {
      console.log('[Auth] Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        console.error('[Auth] Sign in error:', error);
        setAuthError(error.message);
      } else {
        console.log('[Auth] Sign in successful');
        setAuthError(null);
      }
      
      return { data, error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('[Auth] Sign in exception:', err);
      setAuthError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!email?.trim() || !password?.trim() || !fullName?.trim()) {
      const error = 'Tous les champs sont requis';
      setAuthError(error);
      return { data: null, error: { message: error } };
    }

    if (password.length < 6) {
      const error = 'Le mot de passe doit contenir au moins 6 caractères';
      setAuthError(error);
      return { data: null, error: { message: error } };
    }

    setAuthError(null);
    setLoading(true);

    try {
      console.log('[Auth] Signing up user:', email);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { 
          data: { 
            full_name: fullName.trim() 
          } 
        },
      });

      if (error) {
        console.error('[Auth] Sign up error:', error);
        setAuthError(error.message);
      } else {
        console.log('[Auth] Sign up successful');
        setAuthError(null);
      }

      return { data, error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      console.error('[Auth] Sign up exception:', err);
      setAuthError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('[Auth] Signing out user');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Auth] Sign out error:', error);
        setAuthError(error.message);
      } else {
        console.log('[Auth] Sign out successful');
        setAuthError(null);
        if (mountedRef.current) {
          setProfile(null);
        }
      }
      
      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la déconnexion';
      console.error('[Auth] Sign out exception:', err);
      setAuthError(errorMessage);
      return { error: { message: errorMessage } };
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      const error = 'User ID requis';
      console.error('[Auth] Fetch profile error:', error);
      return { data: null, error: { message: error } };
    }

    try {
      console.log('[Auth] Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          organization_id,
          store_id,
          email,
          full_name,
          phone,
          avatar_url,
          role,
          department_id,
          level,
          xp,
          total_audits,
          avg_score,
          completed_trainings,
          active_time_hours,
          last_active,
          is_active,
          created_at,

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

        )
    }
  }
  )
}