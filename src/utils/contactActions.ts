import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

export const callNumber = async (phone?: string | null) => {
  if (!phone) {
    Alert.alert('Unavailable', 'Phone number not available');
    return;
  }

  const url = `tel:${phone}`;
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert('Error', 'Calling is not supported on this device');
    return;
  }

  await Linking.openURL(url);
};

export const openWhatsApp = async (phone?: string | null) => {
  if (!phone) {
    Alert.alert('Unavailable', 'WhatsApp number not available');
    return;
  }

  const formattedPhone = phone.replace('+', '');
  const url = `https://wa.me/${formattedPhone}`;

  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert('Error', 'WhatsApp is not installed');
    return;
  }

  await Linking.openURL(url);
};
