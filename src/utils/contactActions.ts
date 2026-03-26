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

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'Unable to make the call');
  }

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

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'Unable to open WhatsApp');
  }
};

export const openEmail = async (email?: string | null) => {
  if (!email) {
    Alert.alert('Unavailable', 'Email address not available');
    return;
  }

  const url = `mailto:${email}`;
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert('Error', 'No email app found on this device');
    return;
  }

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'Unable to open email app');
  }
};
