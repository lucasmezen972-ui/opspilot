import { useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 Initialisation useAuth...')
    
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Erreur session:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      console.log('📱 Session récupérée:', session ? 'Connecté' : 'Non connecté')
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Changement auth:', event, session ? 'Connecté' : 'Déconnecté')
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('👤 Récupération profil utilisateur:', userId)
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Erreur récupération profil:', profileError)
        setError('Erreur lors de la récupération du profil')
        setLoading(false)
        return
      }

      if (!profileData) {
        console.log('🆕 Profil non trouvé, création automatique...')
        await createUserProfile(userId)
        return
      }

      console.log('✅ Profil récupéré:', profileData)
      setProfile(profileData)
      setError(null)
      setLoading(false)
    } catch (error) {
      console.error('❌ Erreur inattendue profil:', error)
      setError('Erreur inattendue lors de la récupération des données')
      setLoading(false)
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ Utilisateur non trouvé pour création profil')
        setLoading(false)
        return
      }

      console.log('🆕 Création profil pour:', user.email)

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
        console.error('❌ Erreur création profil:', createError)
        setError(`Erreur profil: ${createError.message}`)
        setLoading(false)
        return
      }

      console.log('✅ Profil créé:', newProfile)
      setProfile(newProfile)
      setError(null)
      setLoading(false)
    } catch (error) {
      console.error('❌ Erreur création profil:', error)
      setError('Erreur inattendue lors de la création du profil')
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Connexion pour:', email)
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('❌ Erreur connexion:', error)
      setError(error.message)
      setLoading(false)
    } else {
      console.log('✅ Connexion réussie:', data.user?.email)
      setError(null)
    }
    
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('📝 Inscription pour:', email)
    setError(null)
    setLoading(true)

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
      console.error('❌ Erreur inscription:', error)
      setError(error.message)
      setLoading(false)
    } else {
      console.log('✅ Inscription réussie:', data.user?.email)
      setError(null)
    }
    
    return { data, error }
  }

  const signOut = async () => {
    console.log('🚪 Déconnexion...')
    
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('❌ Erreur déconnexion:', error)
    } else {
      console.log('✅ Déconnexion réussie')
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
    error,
    signIn,
    signUp,
    signOut,
    hasPermission,
    refetchProfile: () => user && fetchUserProfile(user.id),
  }
}