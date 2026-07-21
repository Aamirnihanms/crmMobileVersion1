import React from 'react';
import { useAppTheme, spacing } from '@/src/theme';
import { Platform, StyleProp, StyleSheet, View, ViewStyle, Pressable } from 'react-native';

type AppCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export default function AppCard({ children, style, onPress }: AppCardProps) {
  const { colors, isDark } = useAppTheme();

  const dynamicCardStyles = {
    backgroundColor: colors.surface,
    shadowColor: isDark ? colors.black : colors.textPrimary,
    shadowOpacity: isDark ? 0.3 : 0.05,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          dynamicCardStyles,
          style,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, dynamicCardStyles, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
