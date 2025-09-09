import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import AuthScreen from '../components/AuthScreen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();
  const { user, loading, error } = useAuth();

  // Vérification de la configuration Supabase
  console.log('🚀 OpsPilot - État Application:', {
    supabaseConfigured: !!(
      process.env.EXPO_PUBLIC_SUPABASE_URL && 
      process.env.EXPO_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key'
    ),
    userAuthenticated: !!user,
    isLoading: loading,
    hasError: !!error
  });

  if (loading) {
    console.log('⏳ Application en cours de chargement...', {
      hasUser: !!user,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      hasKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    })
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
