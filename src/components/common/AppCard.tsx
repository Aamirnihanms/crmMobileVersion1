import React from 'react';
import { colors, spacing } from '@/src/theme';
import { Platform, StyleProp, StyleSheet, View, ViewStyle, Pressable } from 'react-native';

type AppCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export default function AppCard({ children, style, onPress }: AppCardProps) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
