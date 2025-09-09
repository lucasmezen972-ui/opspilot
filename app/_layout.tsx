import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AuthScreen from '../components/AuthScreen';
import { useAuth } from '../hooks/useAuth';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { isSupabaseConfigured } from '../utils/supabaseConfig';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();
  useOfflineSync();
  usePushNotifications();
  const { user, loading, authError } = useAuth();

  // Vérification de la configuration Supabase
  console.log('🚀 OpsPilot - État Application:', {
    supabaseConfigured: isSupabaseConfigured(),
    userAuthenticated: !!user,
    isLoading: loading,
    hasError: !!authError,
  });

  if (loading) {
    console.log('⏳ Application en cours de chargement...');
    return null; // Ou un écran de chargement
  }

  if (!user) {
    console.log('🔓 Utilisateur non connecté - Affichage écran auth');
    return (
      <>
        <AuthScreen />
        <StatusBar style="auto" />
      </>
    );
  }

  console.log('🔐 Utilisateur connecté - Affichage app principale');
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
