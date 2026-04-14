import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useResetForgotPassword } from '../../queries/auth.query';
import { colors, spacing } from '@/src/theme';
import useSystemBarsStyle from '@/src/hooks/useSystemBarsStyle';
import { AuthStackParamList } from '../../navigation/AuthStack';

export default function ForgotPasswordResetScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ForgotPasswordReset'>>();
  const { email, otp } = route.params;
  useSystemBarsStyle();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useResetForgotPassword();

  const handleResetPassword = () => {
    setError(null);
    if (!password || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    mutate(
      { email, otp, new_password: password, confirm_password: confirmPassword },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Your password has been reset successfully', [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]);
        },
        onError: (err: any) => {
          console.log('Reset password error:', err?.response?.data);
          const message =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Failed to reset password';
          setError(message);
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
              <AppText variant="h1" style={styles.title}>
                Reset Password
              </AppText>
              <AppText variant="subtitle" color={colors.textSecondary} style={styles.subtitle}>
                Create a new secure password for your account
              </AppText>
            </View>

            <View style={styles.form}>
              <ErrorMessage message={error} onClear={() => setError(null)} />
              <AppInput
                label="New Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <AppInput
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <AppButton
                title={isPending ? 'Resetting...' : 'Update Password'}
                onPress={handleResetPassword}
                style={styles.button}
                loading={isPending}
              />
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
  button: {
    marginTop: spacing.md,
  },
});
