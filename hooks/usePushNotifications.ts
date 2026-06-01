import { useEffect } from 'react';
import { Platform } from 'react-native';

interface NotificationPermission {
  status: string;
}

interface NotificationToken {
  data: string;
}

interface NotificationsModule {
  AndroidImportance: { MAX: number };
  SchedulableTriggerInputTypes: { DATE: string };
  getPermissionsAsync(): Promise<NotificationPermission>;
  requestPermissionsAsync(): Promise<NotificationPermission>;
  getExpoPushTokenAsync(): Promise<NotificationToken>;
  setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowBanner: boolean;
      shouldShowList: boolean;
    }>;
  }): void;
  setNotificationChannelAsync(
    id: string,
    channel: { name: string; importance: number },
  ): Promise<void>;
  scheduleNotificationAsync(options: {
    content: { title: string; body: string };
    trigger: unknown;
  }): Promise<void>;
}

function getNotifications(): NotificationsModule | undefined {
  // Skip notifications entirely on web
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform - notifications disabled');
    return undefined;
  }

  try {
    // Dynamic require to avoid bundling issues
    const Notifications = require('expo-notifications') as NotificationsModule;

    // Set up notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    return Notifications;
  } catch (error) {
    console.log('[Notifications] expo-notifications not available:', error);
    return undefined;
  }
}

export function usePushNotifications() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const Notifications = getNotifications();
    if (!Notifications) return;

    // Initialize push notifications
    registerForPushNotificationsAsync(Notifications).catch((error) => {
      console.warn('[Notifications] Registration failed:', error);
    });
  }, []);
}

async function registerForPushNotificationsAsync(
  Notifications: NotificationsModule,
): Promise<void> {
  // expo-device cannot be imported on web, so require dynamically
  let ExpoDevice: { isDevice: boolean } | undefined;
  try {
    const req = Function('return require')() as (name: string) => { isDevice: boolean };
    ExpoDevice = req('expo-device');
  } catch {
    console.log('expo-device package not available');
    return;
  }
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
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rappel d\u2019audit',
      body,
    },
    trigger: { date, type: Notifications.SchedulableTriggerInputTypes.DATE },
  });
}

export async function sendInternalAlert(message: string) {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Communication interne',
      body: message,
    },
    trigger: null,
  });
}
