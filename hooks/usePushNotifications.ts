import { useEffect } from 'react';
import { Platform } from 'react-native';

interface NotificationsModule {
  AndroidImportance: { MAX: number };
  SchedulableTriggerInputTypes: { DATE: string };
  getPermissionsAsync(): Promise<{ status: string }>;
  requestPermissionsAsync(): Promise<{ status: string }>;
  getExpoPushTokenAsync(): Promise<{ data: string }>;
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
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return undefined;
  }

  let Notifications: NotificationsModule;
  try {
    const req = eval('require') as (name: string) => NotificationsModule;
    const moduleName = 'expo-' + 'notifications';
    Notifications = req(moduleName);
  } catch {
    const moduleName = 'expo-' + 'notifications';
    console.log(moduleName + ' package not available');
    return undefined;
  }

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
}

export function usePushNotifications() {
  useEffect(() => {
    const Notifications = getNotifications();
    if (!Notifications) return;
    registerForPushNotificationsAsync(Notifications);
  }, []);
}

async function registerForPushNotificationsAsync(
  Notifications: NotificationsModule,
): Promise<void> {
  // expo-device cannot be imported on web, so require dynamically
  let ExpoDevice: { isDevice: boolean } | undefined;
  try {
    const req = eval('require') as (name: string) => { isDevice: boolean };
    const moduleName = 'expo-' + 'device';
    ExpoDevice = req(moduleName);
  } catch {
    const moduleName = 'expo-' + 'device';
    console.log(moduleName + ' package not available');
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
