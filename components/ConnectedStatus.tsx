import {
  CircleCheck as CheckCircle,
  Wifi,
  CircleAlert,
} from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '../shared/styles/tokens';
import { getSupabaseConfigStatus } from '../utils/supabaseConfig';

interface ConnectedStatusProps {
  dataCount?: number;
}

export default function ConnectedStatus({ dataCount }: ConnectedStatusProps) {
  const { status } = getSupabaseConfigStatus();

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
  } else if (status === 'valid') {
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
  errorText: {
    color: colors.dangerStrong,
    fontWeight: '500',
  },
});
