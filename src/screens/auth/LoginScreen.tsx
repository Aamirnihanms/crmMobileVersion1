import useSystemBarsStyle from '@/src/hooks/useSystemBarsStyle';
import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginPlatform } from '../../api/auth.api';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import { getFCMToken } from '../../lib/firebaseHelper';
import { useLogin } from '../../queries/auth.query';
import { useAuthStore } from '../../store/auth.store';
import { mapLoginUserToStoredUser } from '../../utils/authUser';
import { saveAuthUser, saveToken } from '../../utils/token';

import { AuthStackParamList } from '../../navigation/AuthStack';

const getLoginPlatform = (): LoginPlatform => {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'web') return 'web';
  return 'unknown';
};

const logo = require('../../../assets/images/logo.png');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  useSystemBarsStyle();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);
  const setUser = useAuthStore((s) => s.setUser);
  const { mutate, isPending, isError, error } = useLogin();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation error', 'Email and password are required');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const fcmToken = await getFCMToken();
    const platform = getLoginPlatform();

    mutate(
      { email: normalizedEmail, password, fcmToken, platform },
      {
        onSuccess: async (data) => {
          const normalizedUser = mapLoginUserToStoredUser(data.user);
          await saveToken(data.access);
          await saveAuthUser(normalizedUser);
          useAuthStore.getState().setToken(data.access);
          setUser(normalizedUser);
          setLoggedIn(true);
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authCard}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
              </View>

              <AppText variant="h1" style={styles.title}>
                Welcome Back
              </AppText>
              <AppText variant="subtitle" color={colors.textSecondary} style={styles.subtitle}>
                Sign in to access your CRM dashboard
              </AppText>
            </View>

            <View style={styles.form}>
              <AppInput
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <AppInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPasswordRequest')}
              >
                <AppText variant="caption" color={colors.primary} style={styles.forgotText}>
                  Forgot Password?
                </AppText>
              </TouchableOpacity>

              <AppButton
                title={isPending ? 'Signing in...' : 'Sign In'}
                onPress={handleLogin}
                style={styles.button}
                loading={isPending}
              />

              {isError && (
                <AppText variant="caption" color={colors.danger} style={styles.errorText}>
                  {(error as any)?.response?.data?.error ??
                    (error as any)?.response?.data?.detail ??
                    (error as Error)?.message ??
                    'Invalid credentials'}
                </AppText>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundOrbTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primaryLight,
    top: -110,
    right: -70,
    opacity: 0.25,
  },
  backgroundOrbBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.indigoSoft,
    bottom: -90,
    left: -60,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  authCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 7,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  logo: {
    width: 82,
    height: 82,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 260,
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontWeight: '600',
  },
  button: {
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  errorText: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
