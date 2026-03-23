import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';
import AppText from './AppText';

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export default function AppInput({
  label,
  error,
  style,
  containerStyle,
  ...props
}: AppInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText
          variant="caption"
          color={colors.textSecondary}
          style={styles.label}
        >
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
        <AppText
          variant="caption"
          color={colors.danger}
          style={styles.errorText}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    height: 52,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
