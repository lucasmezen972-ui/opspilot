import { Slot } from 'expo-router';

import AuthScreen from '../components/AuthScreen';
import { useAuth } from '../hooks/useAuth';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  const { user, ready, loading } = useAuth();
  useFrameworkReady();

  if (!ready || loading) {
    return null;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <Slot />;
}
