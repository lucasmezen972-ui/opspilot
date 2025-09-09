import { useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, isConfigured } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (__DEV__) console.log('🔍 Init useAuth...')
    
    let cancelled = false
    
    // Initialisation async avec protection race condition
    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (cancelled) return
        
        if (error) {
          if (__DEV__) console.error('❌ Session error:', error)
          setError(error.message)
          setReady(true)
          setLoading(false)
          return
        }

        if (__DEV__) console.log('📱 Session:', session ? 'Connected' : 'Not connected')
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setProfile(null)
          setReady(true)
          setLoading(false)
        }
      } catch (error: any) {
        if (!cancelled) {
          if (__DEV__) console.error('❌ Init error:', error)
          setError(error.message)
          setReady(true)
          setLoading(false)
        }
      }
    }

    initialize()

    // Écouter changements auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      
      if (__DEV__) console.log('🔄 Auth change:', event)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
        setReady(true)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      if (__DEV__) console.log('👤 Récupération profil utilisateur:', userId)
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        if (__DEV__) console.error('❌ Erreur récupération profil:', profileError)
        setError('Erreur lors de la récupération du profil')
        setReady(true)
        setLoading(false)
        return
      }

      if (!profileData) {
        if (__DEV__) console.log('🆕 Profil non trouvé, création automatique...')
        await createUserProfile(userId)
        return
      }

      if (__DEV__) console.log('✅ Profil récupéré')
      setProfile(profileData)
      setError(null)
      setReady(true)
      setLoading(false)
    } catch (error) {
      if (__DEV__) console.error('❌ Erreur inattendue profil:', error)
      setError('Erreur inattendue lors de la récupération des données')
      setReady(true)
      setLoading(false)
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (__DEV__) console.log('❌ Utilisateur non trouvé pour création profil')
        setReady(true)
        setLoading(false)
        return
      }

      if (__DEV__) console.log('🆕 Création profil pour:', user.email)

      // Utiliser UPSERT pour éviter les conflits de clés
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          organization_id: '550e8400-e29b-41d4-a716-446655440000',
          store_id: '550e8400-e29b-41d4-a716-446655440001',
          email: user.email || '',
          role: 'employé',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          level: 1,
          xp: 850,
          total_audits: 47,
          avg_score: 92,
          completed_trainings: 12,
          active_time_hours: 156,
          is_active: true
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (createError) {
        if (__DEV__) console.error('❌ Erreur création profil:', createError)
        setError(`Erreur profil: ${createError.message}`)
        setReady(true)
        setLoading(false)
        return
      }

      if (__DEV__) console.log('✅ Profil créé')
      setProfile(newProfile)
      setError(null)
      setReady(true)
      setLoading(false)
    } catch (error) {
      if (__DEV__) console.error('❌ Erreur création profil:', error)
      setError('Erreur inattendue lors de la création du profil')
      setReady(true)
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (__DEV__) console.log('🔑 Connexion pour:', email)
    setError(null)
    setLoading(true)

    // Vérification de la configuration avant tentative
    if (!isConfigured) {
      setError('Configuration Supabase incomplète. Cliquez "Connect to Supabase" en haut à droite.')
      setLoading(false)
      return { data: null, error: { message: 'Configuration Supabase manquante' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      if (__DEV__) console.error('❌ Erreur connexion:', error)
      if (error.message?.includes('Network request failed')) {
        setError('Erreur de connexion. Vérifiez votre réseau et la configuration Supabase.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      if (__DEV__) console.log('✅ Connexion réussie:', data.user?.email)
      setError(null)
    }
    
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (__DEV__) console.log('📝 Inscription pour:', email)
    setError(null)
    setLoading(true)

    // Vérification de la configuration avant tentative
    if (!isConfigured) {
      setError('Configuration Supabase incomplète. Cliquez "Connect to Supabase" en haut à droite.')
      setLoading(false)
      return { data: null, error: { message: 'Configuration Supabase manquante' } }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    
    if (error) {
      if (__DEV__) console.error('❌ Erreur inscription:', error)
      if (error.message?.includes('Network request failed')) {
        setError('Erreur de connexion. Vérifiez votre réseau et la configuration Supabase.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      if (__DEV__) console.log('✅ Inscription réussie:', data.user?.email)
      setError(null)
    }
    
    return { data, error }
  }

  const signOut = async () => {
    if (__DEV__) console.log('🚪 Déconnexion...')
    
    const { error } = await supabase.auth.signOut()
    if (error) {
      if (__DEV__) console.error('❌ Erreur déconnexion:', error)
    } else {
      if (__DEV__) console.log('✅ Déconnexion réussie')
      setProfile(null)
      setError(null)
    }
    return { error }
  }

  // Fonction helper pour vérifier les permissions (simplifié pour la démo)
  const hasPermission = (resource: string, action: string): boolean => {
    return true // Autorisations simplifiées pour la démo
  }

  return {
    session,
    user,
    profile,
    loading,
    ready,
    error,
    signIn,
    signUp,
    signOut,
    hasPermission,
    refetchProfile: () => user && fetchUserProfile(user.id),
  }
}