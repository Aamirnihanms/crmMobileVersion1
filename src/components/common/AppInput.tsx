import { useAppTheme, spacing } from '@/src/theme';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import AppText from './AppText';

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
};

export default function AppInput({
  label,
  error,
  style,
  containerStyle,
  rightElement,
  leftElement,
  ...props
}: AppInputProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
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
        props.multiline && styles.multilineInputWrapper,
      ]}>
        {leftElement && (
          <View style={styles.leftElement}>
            {leftElement}
          </View>
        )}
        <TextInput
          {...props}
          style={[
            styles.input,
            props.multiline && { textAlignVertical: 'top' },
            leftElement ? { paddingLeft: 0 } : null,
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

const getStyles = (colors: any) => StyleSheet.create({
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
  multilineInputWrapper: {
    height: undefined,
    minHeight: 80,
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
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
  leftElement: {
    paddingLeft: spacing.md,
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
