import { AuthorizationStatus, getMessaging, getToken, requestPermission } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Platform } from 'react-native';

/** Race a promise against a timeout. Resolves to `fallback` if time runs out. */
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function requestUserPermission() {
  console.log('--- FCM Permission Request Start ---');

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS'
      );
      console.log('Android POST_NOTIFICATIONS permission status:', granted);
    } catch (err) {
      console.warn('Android POST_NOTIFICATIONS request error:', err);
    }
  }

  // Use expo-notifications to check/request permission (hooks into native system reliably)
  const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
  console.log('Current notification status (expo):', existingStatus, '| Can ask again:', canAskAgain);
  
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted' && canAskAgain) {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('New notification status after request (expo):', finalStatus);
  }

  if (finalStatus === 'denied' && !canAskAgain) {
    console.warn('⚠️ Notification permission is PERMANENTLY DENIED in system settings. Please uninstall the app or go to settings to enable it.');
  }

  // Check with Firebase messaging as well
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  console.log('Firebase Authorization status:', authStatus);
  console.log('--- FCM Permission Request End (Enabled:', enabled, ') ---');

  return enabled || finalStatus === 'granted';
}

export async function getFCMToken() {
  try {
    const messaging = getMessaging();

    // Mandatory for iOS: Register device for remote messages before getting token.
    // Wrapped in a 5s timeout — this call can stall on a fresh install if APNs
    // is slow or not yet configured, which would otherwise freeze the app.
    if (Platform.OS === 'ios') {
      try {
        await withTimeout(
          messaging.registerDeviceForRemoteMessages(),
          5000,
          undefined as unknown as void
        );
      } catch (err) {
        console.warn('⚠️ registerDeviceForRemoteMessages() failed or timed out:', err);
        // Continue anyway — token fetch may still work if device was previously registered
      }
    }

    const fcmToken = await getToken(messaging);
    if (fcmToken) {
      console.log('FCM Device Token:', fcmToken);
      // Here you can send the token to your backend if needed
      return fcmToken;
    }
  } catch (error) {
    console.log('Error fetching FCM Token:', error);
  }
  return null;
}
