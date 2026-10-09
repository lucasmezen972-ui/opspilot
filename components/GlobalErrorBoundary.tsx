import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { AppErrorState } from '../shared/components/AppErrorState';
import { colors, radius, spacing } from '../shared/styles/tokens';

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
    if (__DEV__) {
      console.error('[GlobalErrorBoundary] Uncaught error:', error, info);
    }
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
        <View style={styles.container}>
          <AppErrorState
            testID="error-boundary-screen"
            title="Une erreur est survenue"
            message="Si le problème persiste, relancez l'application."
            onRetry={this.handleReset}
          />
          {__DEV__ && this.state.error && (
            <Text style={styles.devError} testID="error-boundary-details">
              {this.state.error.message}
            </Text>
          )}
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
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  devError: {
    fontSize: 11,
    color: colors.danger,
    fontFamily: 'monospace',
    backgroundColor: colors.dangerSoft,
    padding: 10,
    borderRadius: radius.sm,
    marginTop: spacing.md,
    maxWidth: '100%',
  },
});
