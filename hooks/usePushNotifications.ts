import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      registerForPushNotifications();
    }
  }, [profile]);
}

async function registerForPushNotifications() {
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
    }
  } catch (err) {
    console.error('Erreur en enregistrant le token push', err);
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null,
  });
}

export async function scheduleAuditReminder(title: string, date: Date) {
  await Notifications.scheduleNotificationAsync({
    content: { title: "Rappel d'audit", body: title, data: { type: 'audit' } },
    trigger: date,
  });
}
