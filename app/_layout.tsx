import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import AuthScreen from '../components/AuthScreen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();
  const { user, loading, ready, error } = useAuth();

  if (__DEV__) {
    console.log('🚀 App State:', {
      configured: !!(process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('supabase.co')),
      authenticated: !!user,
      loading,
      ready,
      hasError: !!error
    })
  }

  if (loading || !ready) {
    return null; // Ou un écran de chargement
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <StatusBar style="auto" />
      </>
    );
  }

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
