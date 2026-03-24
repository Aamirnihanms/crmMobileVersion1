import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import { useLogin } from '../../queries/auth.query';
import { useAuthStore } from '../../store/auth.store';
import { colors, spacing } from '../../theme';
import { saveToken } from '../../utils/token';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);
  const setUser = useAuthStore((s) => s.setUser);
  const { mutate, isPending, isError, error } = useLogin();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Validation error', 'Email and password are required');
      return;
    }

    mutate(
      { email, password },
      {
        onSuccess: async (data) => {
          await saveToken(data.access);
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="sparkles" size={40} color={colors.primary} />
            </View>
            <AppText variant="h1" style={styles.title}>Welcome Back</AppText>
            <AppText variant="subtitle" color={colors.textSecondary} style={styles.subtitle}>
              Sign in to continue your journey
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

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <AppText variant="caption" color={colors.textMuted} style={styles.dividerText}>
                OR CONTINUE WITH
              </AppText>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={24} color={colors.primaryDark} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <AppText variant="body" color={colors.textSecondary}>
              Don't have an account?{' '}
            </AppText>
            <TouchableOpacity>
              <AppText variant="body" color={colors.primary} style={styles.signUpText}>
                Sign Up
              </AppText>
            </TouchableOpacity>
          </View>

          {isError && (
            <AppText variant="caption" color={colors.danger} style={styles.errorText}>
              {(error as Error)?.message}
            </AppText>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    // Shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
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
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    fontWeight: '700',
    fontSize: 10,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: spacing.lg,
  },
  signUpText: {
    fontWeight: '700',
  },
  errorText: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
