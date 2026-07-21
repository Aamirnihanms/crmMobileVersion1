import { useAppTheme, spacing, typography } from '@/src/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import AppText from './AppText';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  textStyle?: StyleProp<TextStyle>;
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  style,
  loading = false,
  disabled = false,
  textStyle,
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const isDisabled = disabled || loading;

  const renderContent = () => (
    loading ? (
      <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.surface} />
    ) : (
      <AppText
        style={[styles.text, textStyle]}
        color={variant === 'outline' ? colors.primary : colors.surface}
      >
        {title}
      </AppText>
    )
  );

  if (variant === 'primary' && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.container,
          (pressed || loading) && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, loading && { opacity: 0.8 }]}
        >
          {renderContent()}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || loading) && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {renderContent()}
    </Pressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  gradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  text: {
    ...typography.button,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    backgroundColor: colors.divider,
    opacity: 0.6,
  },
});
