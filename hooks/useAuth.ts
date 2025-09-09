import { useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 Initialisation useAuth...')
    checkSupabaseConnection()
    // Récupérer la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📱 Session récupérée:', session ? 'Connecté' : 'Non connecté')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Changement auth:', _event, session ? 'Connecté' : 'Déconnecté')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkSupabaseConnection = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔗 Configuration Supabase:', {
      url: supabaseUrl ? 'Configuré' : 'MANQUANT',
      key: supabaseKey ? 'Configuré' : 'MANQUANT',
      isPlaceholder: supabaseUrl === 'https://placeholder.supabase.co'
    })
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      setError('Supabase non configuré. Cliquez sur "Connect to Supabase" en haut à droite.')
      return false
    }
    
    setError(null)
    return true
  }

  const fetchProfile = async (userId: string) => {
    try {
      console.log('👤 Récupération profil pour:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Erreur récupération profil:', error)
        // Si le profil n'existe pas, on le crée
        if (error.code === 'PGRST116') {
          console.log('🆕 Création du profil manquant...')
          await createProfile(userId)
        }
        return
      }

      console.log('✅ Profil récupéré:', data)
      setProfile(data)
    } catch (error) {
      console.error('❌ Erreur inattendue profil:', error)
    }
  }

  const createProfile = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email || '',
          role: 'employé',
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur création profil:', error)
        return
      }

      console.log('✅ Profil créé:', data)
      setProfile(data)
    } catch (error) {
      console.error('❌ Erreur création profil:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Tentative de connexion pour:', email)
    setError(null)
    
    if (!checkSupabaseConnection()) {
      return { data: null, error: { message: 'Supabase non configuré' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('❌ Erreur connexion:', error)
      setError(error.message)
    } else {
      console.log('✅ Connexion réussie:', data.user?.email)
      setError(null)
    }
    
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('📝 Tentative d\'inscription pour:', email)
    setError(null)
    
    if (!checkSupabaseConnection()) {
      return { data: null, error: { message: 'Supabase non configuré' } }
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
      console.error('❌ Erreur inscription:', error)
      setError(error.message)
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
    }
    return { error }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Utilisateur non connecté' }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
    }

    return { data, error }
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
    updateProfile,
    refetchProfile: () => user && fetchProfile(user.id),
  }
}