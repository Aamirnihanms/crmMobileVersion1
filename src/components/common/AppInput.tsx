import { TextInput, StyleSheet, View, TextInputProps } from 'react-native';
import { colors, spacing } from '../../theme';
import AppText from './AppText';

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export default function AppInput({
  label,
  error,
  style,
  ...props
}: AppInputProps) {
  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
      ) : null}

      <TextInput
        {...props}
        style={[
          styles.input,
          error && styles.errorBorder,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
      />

      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
});
