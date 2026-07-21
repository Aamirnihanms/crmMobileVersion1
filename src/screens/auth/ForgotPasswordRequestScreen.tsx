import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useSendForgotPasswordOTP } from '../../queries/auth.query';
import { useAppTheme, spacing } from '@/src/theme';
import useSystemBarsStyle from '@/src/hooks/useSystemBarsStyle';
import { AuthStackParamList } from '../../navigation/AuthStack';

export default function ForgotPasswordRequestScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  useSystemBarsStyle();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useSendForgotPasswordOTP();

  const handleSendOTP = () => {
    setError(null);
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    mutate(
      { email },
      {
        onSuccess: () => {
          Alert.alert('Success', 'OTP has been sent to your email', [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ForgotPasswordVerify', { email }),
            },
          ]);
        },
        onError: (err: any) => {
          console.log('Send OTP error:', err?.response?.data);
          const message =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Failed to send OTP';
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
                Forgot Password
              </AppText>
              <AppText variant="subtitle" color={colors.textSecondary} style={styles.subtitle}>
                Enter your email address to receive a password reset OTP
              </AppText>
            </View>

            <View style={styles.form}>
              <ErrorMessage message={error} onClear={() => setError(null)} />
              <AppInput
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <AppButton
                title={isPending ? 'Sending OTP...' : 'Send OTP'}
                onPress={handleSendOTP}
                style={styles.button}
                loading={isPending}
              />
              
              <AppButton
                title="Back to Login"
                variant="outline"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
  backButton: {
    marginTop: spacing.md,
  },
});
