import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);
}

async function registerForPushNotificationsAsync() {
  // Only load expo-device on native platforms
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return;
  }

  // expo-device cannot be imported on web, so require dynamically
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ExpoDevice = require('expo-device');
  if (!ExpoDevice?.isDevice) {
    console.log('Push notifications require a physical device');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Expo push token:', token);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}

export async function scheduleAuditReminder(date: Date, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rappel d\u2019audit',
      body,
    },
    trigger: { date, type: Notifications.SchedulableTriggerInputTypes.DATE },
  });
}

export async function sendInternalAlert(message: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Communication interne',
      body: message,
    },
    trigger: null,
  });
}
