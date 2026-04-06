import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import { useLogin } from '../../queries/auth.query';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing } from '@/src/theme';
import useSystemBarsStyle from '@/src/hooks/useSystemBarsStyle';
import { saveAuthUser, saveToken } from '../../utils/token';
import { getFCMToken } from '../../lib/firebaseHelper';
import { LoginPlatform } from '../../api/auth.api';

const getLoginPlatform = (): LoginPlatform => {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'web') return 'web';
  return 'unknown';
};

const logo = require('../../../assets/images/logo.png');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  useSystemBarsStyle();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);
  const setUser = useAuthStore((s) => s.setUser);
  const { mutate, isPending, isError, error } = useLogin();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation error', 'Email and password are required');
      return;
    }

    const fcmToken = await getFCMToken();
    const platform = getLoginPlatform();

    mutate(
      { email, password, fcmToken, platform },
      {
        onSuccess: async (data) => {
          await saveToken(data.access);
          await saveAuthUser(data.user ?? null);
          setUser(data.user ?? null);
          setLoggedIn(true);
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.detail ??
            err?.message ??
            'Invalid credentials';
          Alert.alert('Login failed', message);
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
                secureTextEntry
              />

              <TouchableOpacity style={styles.forgotPassword}>
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
                  {(error as Error)?.message}
                </AppText>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <AppText variant="body" color={colors.textSecondary}>
              {"Don't have an account? "}
            </AppText>
            <TouchableOpacity>
              <AppText variant="body" color={colors.primary} style={styles.signUpText}>
                Sign Up
              </AppText>
            </TouchableOpacity>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  signUpText: {
    fontWeight: '700',
  },
  errorText: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
