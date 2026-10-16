import {
  CircleCheck as CheckCircle,
  Wifi,
  CircleAlert,
  WifiOff,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../shared/styles/tokens';
import { getSupabaseConfigStatus } from '../utils/supabaseConfig';

interface ConnectedStatusProps {
  dataCount?: number;
}

function useSupabaseReachable(): 'checking' | 'reachable' | 'unreachable' {
  const { status, url } = getSupabaseConfigStatus();
  const [reachable, setReachable] = useState<
    'checking' | 'reachable' | 'unreachable'
  >(status !== 'valid' ? 'unreachable' : 'checking');

  useEffect(() => {
    if (status !== 'valid' || !url) {
      setReachable('unreachable');
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
    })
      .then((res) => {
        if (!cancelled)
          setReachable(
            res.ok || res.status === 401 ? 'reachable' : 'unreachable',
          );
      })
      .catch(() => {
        if (!cancelled) setReachable('unreachable');
      })
      .finally(() => clearTimeout(timer));
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [status, url]);

  return reachable;
}

export default function ConnectedStatus({ dataCount }: ConnectedStatusProps) {
  const { status } = getSupabaseConfigStatus();
  const reachable = useSupabaseReachable();

  let message = '⚠️ Configuration Supabase incomplète';
  let containerStyle: (typeof styles)[keyof typeof styles] =
    styles.disconnected;
  let textStyle: (typeof styles)[keyof typeof styles] = styles.disconnectedText;
  let Icon = Wifi;
  let iconColor: string = colors.textMuted;

  if (status === 'missing') {
    message = '❌ URL Supabase manquante';
    containerStyle = styles.error;
    textStyle = styles.errorText;
    Icon = CircleAlert;
    iconColor = colors.dangerStrong;
  } else if (status === 'placeholder') {
    message = '❌ URL Supabase invalide';
    containerStyle = styles.error;
    textStyle = styles.errorText;
    Icon = CircleAlert;
    iconColor = colors.dangerStrong;
  } else if (status === 'valid' && reachable === 'checking') {
    message = '⏳ Connexion en cours…';
    containerStyle = styles.disconnected;
    textStyle = styles.disconnectedText;
    Icon = Wifi;
    iconColor = colors.textMuted;
  } else if (status === 'valid' && reachable === 'unreachable') {
    message = '⚠️ Supabase injoignable — mode démo disponible';
    containerStyle = styles.warning;
    textStyle = styles.warningText;
    Icon = WifiOff;
    iconColor = colors.warningText;
  } else if (status === 'valid' && reachable === 'reachable') {
    message = `✅ Supabase connecté${dataCount ? ` • ${dataCount} enregistrements` : ''}`;
    containerStyle = styles.connected;
    textStyle = styles.connectedText;
    Icon = CheckCircle;
    iconColor = colors.success;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Icon size={16} color={iconColor} />
      <Text style={[styles.text, textStyle]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.lg,
  },
  connected: {
    backgroundColor: colors.successSoft,
  },
  disconnected: {
    backgroundColor: colors.backgroundAlt,
  },
  warning: {
    backgroundColor: colors.warningSoft,
  },
  error: {
    backgroundColor: colors.dangerSoft,
  },
  text: {
    fontSize: 12,
    marginLeft: 6,
  },
  connectedText: {
    color: colors.successText,
    fontWeight: '500',
  },
  disconnectedText: {
    color: colors.textMuted,
  },
  warningText: {
    color: colors.warningText,
    fontWeight: '500',
  },
  errorText: {
    color: colors.dangerStrong,
    fontWeight: '500',
  },
});
