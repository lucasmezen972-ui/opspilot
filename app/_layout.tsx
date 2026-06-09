import { Slot } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';

import AuthScreen from '../components/AuthScreen';
import OnboardingScreen from '../components/OnboardingScreen';
import { AuthProvider, useAuth } from '../hooks/AuthContext';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';

function AuthGate() {
  const { user, profile, ready, loading } = useAuth();
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

  if (!profile?.organization_id) {
    return <OnboardingScreen />;
  }

  return <Slot />;
}

type ErrorBoundaryState = { error: Error | null };

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700' }}>!</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
            Une erreur est survenue
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
            {this.state.error.message}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ error: null })}
            style={{ backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ErrorBoundary>
  );
}
