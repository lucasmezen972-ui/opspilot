import { Slot } from 'expo-router';

import AuthScreen from '../components/AuthScreen';
import { AuthProvider, useAuth } from '../hooks/AuthContext';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';

function AuthGate() {
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

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
