import { getMessaging, getToken, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';

export async function requestUserPermission() {
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('FCM Authorization status:', authStatus);
  } else {
    console.log('FCM permission denied or not determined');
  }
  return enabled;
}

export async function getFCMToken() {
  try {
    const messaging = getMessaging();
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
