import '../utils/alertPolyfill';

import { Slot, useSegments } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

import AuthScreen from '../components/AuthScreen';
import GlobalErrorBoundary from '../components/GlobalErrorBoundary';
import OnboardingScreen from '../components/OnboardingScreen';
import { AuthProvider, useAuth } from '../hooks/AuthContext';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';

console.log('APP START');
console.log('ROUTER START');

function AuthGate() {
  const { user, profile, ready, loading } = useAuth();
  const segments = useSegments();
  const isPublicLegalRoute = segments[0] === 'legal';
  useFrameworkReady();

  if (isPublicLegalRoute) {
    return <Slot />;
  }

  if (!ready || loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#2563EB',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700' }}>
            OP
          </Text>
        </View>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 16 }}>
          Chargement...
        </Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!profile?.organization_id) {
    return <OnboardingScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
