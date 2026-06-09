import { Slot } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';

import AuthScreen from '../components/AuthScreen';
import { AuthProvider, useAuth } from '../hooks/AuthContext';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';

function AuthGate() {
  const { user, ready, loading } = useAuth();
  useFrameworkReady();

  if (!ready || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700' }}>OP</Text>
        </View>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 16 }}>Chargement...</Text>
      </View>
    );
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
