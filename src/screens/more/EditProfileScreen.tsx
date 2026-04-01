import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import PhoneInputWithCode, { COUNTRY_CODES, CountryCode, DEFAULT_COUNTRY } from '@/src/components/common/PhoneInputWithCode';
import ScreenShell from '@/src/components/common/ScreenShell';
import { useUpdateProfile } from '@/src/queries/profile.query';
import { colors, spacing } from '@/src/theme';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MoreStackParamList } from '../../navigation/MoreStack';

export default function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const route = useRoute<any>();
  const { user } = route.params;

  const [fullName, setFullName] = useState(user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  
  // Parse phone and country code
  const getInitialCC = (code: string | null, phone: string | null) => {
    if (code) {
      const normalized = code.startsWith('+') ? code : `+${code}`;
      const found = COUNTRY_CODES.find(c => c.code === normalized);
      if (found) return found;
    }
    if (phone) {
      const found = COUNTRY_CODES.find(c => phone.startsWith(c.code));
      if (found) return found;
    }
    return DEFAULT_COUNTRY;
  };

  const phoneCC_ = getInitialCC(user.phone_country_code, user.phone);
  const whatsappCC_ = getInitialCC(user.whatsapp_number_country_code, user.whatsapp_number);

  const [phone, setPhone] = useState(user.phone ? user.phone.replace(phoneCC_.code, '') : '');
  const [phoneCC, setPhoneCC] = useState<CountryCode>(phoneCC_);

  const [whatsapp, setWhatsapp] = useState(user.whatsapp_number ? user.whatsapp_number.replace(whatsappCC_.code, '') : '');
  const [whatsappCC, setWhatsappCC] = useState<CountryCode>(whatsappCC_);

  const [profilePic, setProfilePic] = useState<any>(null);
  const [previewUri, setPreviewUri] = useState(user.profile_pic);

  const updateProfileMutation = useUpdateProfile();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPreviewUri(asset.uri);
      setProfilePic({
        uri: asset.uri,
        name: asset.fileName || 'profile_pic.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full Name is required');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        full_name: fullName,
        email,
        phone: `${phoneCC.code}${phone}`,
        whatsapp_number: `${whatsappCC.code}${whatsapp}`,
        phone_country_code: phoneCC.code.replace('+', ''),
        whatsapp_number_country_code: whatsappCC.code.replace('+', ''),
        profile_pic: profilePic,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.avatarSection}>
            <Pressable style={styles.avatarContainer} onPress={handlePickImage}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.avatar} />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Ionicons name="person" size={40} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.editIconBadge}>
                <Ionicons name="camera" size={16} color={colors.surface} />
              </View>
            </Pressable>
          </View>

          <View style={styles.formContainer}>
            <AppInput
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              containerStyle={styles.inputGap}
            />

            <AppInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.inputGap}
            />

            <PhoneInputWithCode
              label="Phone Number"
              value={phone}
              countryCode={phoneCC}
              onChangeText={setPhone}
              onChangeCountryCode={setPhoneCC}
              containerStyle={styles.inputGap}
            />

            <PhoneInputWithCode
              label="WhatsApp Number"
              value={whatsapp}
              countryCode={whatsappCC}
              onChangeText={setWhatsapp}
              onChangeCountryCode={setWhatsappCC}
              containerStyle={styles.inputGap}
            />
          </View>

          <AppButton
            title="Save Changes"
            onPress={handleSave}
            loading={updateProfileMutation.isPending}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    backgroundColor: colors.surfaceAlt,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  formContainer: {
    marginTop: spacing.md,
  },
  inputGap: {
    marginBottom: spacing.lg,
  },
  saveBtn: {
    marginTop: spacing.xl,
  },
});
