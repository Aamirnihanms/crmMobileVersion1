import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const HIGH_IMPORTANCE_CHANNEL_ID = 'high_importance';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function configureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(HIGH_IMPORTANCE_CHANNEL_ID, {
    name: 'High Importance',
    importance: Notifications.AndroidImportance.MAX,
    showBadge: true,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function showForegroundNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) {
  // On iOS, expo-notifications' setNotificationHandler (or APNs itself)
  // automatically displays the remote notification banner in the foreground.
  // Showing a local notification manually here causes a duplicate.
  if (Platform.OS === 'ios') {
    return;
  }

  const title = remoteMessage.notification?.title ?? 'New notification';
  const body = remoteMessage.notification?.body ?? '';

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: remoteMessage.data ?? {},
    },
    trigger: null,
  });
}
