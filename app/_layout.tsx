import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import AuthScreen from '../components/AuthScreen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { isSupabaseConfigured } from '../utils/supabaseConfig';

export default function RootLayout() {
  useFrameworkReady();
  const { user, loading, error } = useAuth();

  // Vérification de la configuration Supabase
  console.log('🚀 OpsPilot - État Application:', {
    supabaseConfigured: isSupabaseConfigured(),
    userAuthenticated: !!user,
    isLoading: loading,
    hasError: !!error
  });

  if (loading) {
    console.log('⏳ Application en cours de chargement...')
    return null; // Ou un écran de chargement
  }

  if (!user) {
    console.log('🔓 Utilisateur non connecté - Affichage écran auth')
    return (
      <>
        <AuthScreen />
        <StatusBar style="auto" />
      </>
    );
  }

  console.log('🔐 Utilisateur connecté - Affichage app principale')
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
