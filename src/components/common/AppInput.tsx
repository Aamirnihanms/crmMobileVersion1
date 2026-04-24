import { colors, spacing } from '@/src/theme';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import AppText from './AppText';

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
};

export default function AppInput({
  label,
  error,
  style,
  containerStyle,
  rightElement,
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

      <View style={[
        styles.inputWrapper,
        error && styles.errorBorder,
      ]}>
        <TextInput
          {...props}
          style={[
            styles.input,
            style,
          ]}
          placeholderTextColor={colors.textMuted}
        />
        {rightElement && (
          <View style={styles.rightElement}>
            {rightElement}
          </View>
        )}
      </View>

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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    height: 46,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    height: '100%',
  },
  rightElement: {
    paddingRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
