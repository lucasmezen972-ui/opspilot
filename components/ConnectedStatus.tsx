import {
  CircleCheck as CheckCircle,
  Wifi,
  CircleAlert,
} from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { getSupabaseConfigStatus } from '../utils/supabaseConfig';

interface ConnectedStatusProps {
  dataCount?: number;
}

export default function ConnectedStatus({ dataCount }: ConnectedStatusProps) {
  const { status } = getSupabaseConfigStatus();

  let message = '⚠️ Cliquez "Connect to Supabase" en haut à droite';
  let containerStyle = styles.disconnected;
  let textStyle = styles.disconnectedText;
  let Icon = Wifi;
  let iconColor = '#6B7280';

  if (status === 'missing' || status === 'placeholder') {
    message = 'Mode demo actif - donnees locales';
    containerStyle = styles.disconnected;
    textStyle = styles.disconnectedText;
    Icon = Wifi;
    iconColor = '#F59E0B';
  } else if (status === 'valid') {
    message = `✅ Supabase connecté${dataCount ? ` • ${dataCount} enregistrements` : ''}`;
    containerStyle = styles.connected;
    textStyle = styles.connectedText;
    Icon = CheckCircle;
    iconColor = '#10B981';
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
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  connected: {
    backgroundColor: '#DCFCE7',
  },
  disconnected: {
    backgroundColor: '#F3F4F6',
  },
  error: {
    backgroundColor: '#FEE2E2',
  },
  text: {
    fontSize: 12,
    marginLeft: 6,
  },
  connectedText: {
    color: '#16A34A',
    fontWeight: '500',
  },
  disconnectedText: {
    color: '#6B7280',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '500',
  },
});
