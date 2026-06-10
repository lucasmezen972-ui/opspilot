import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Uncaught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View testID="error-boundary-screen" style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.subtitle}>
            Si le problème persiste, relancez l'application.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.devError} testID="error-boundary-details">
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity
            testID="error-boundary-retry"
            style={styles.button}
            onPress={this.handleReset}
          >
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  devError: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: 'monospace',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
    maxWidth: '100%',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
