import { View, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import AppInput from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';
import AppText from '../../components/common/AppText';
import { spacing } from '../../theme';
import { saveToken } from '../../utils/token';
import { useAuthStore } from '../../store/auth.store';
import { useLogin } from '../../queries/auth.query';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);
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
          setLoggedIn(true);
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.detail ??
            err?.message ??
            'Invalid credentials';
          console.error('Login error:', message);
          Alert.alert('Login failed', message);
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <AppText variant="title">Login</AppText>

      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <AppInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <AppButton
        title={isPending ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
      />

      {isError && (
        <AppText variant="caption" color="red">
          {(error as Error)?.message}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
});
