import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { useAppTheme, spacing } from '@/src/theme';

type ErrorMessageProps = {
  message: string | null;
  onClear: () => void;
};

export default function ErrorMessage({ message, onClear }: ErrorMessageProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={20} color={colors.danger} />
      <AppText style={styles.text} color={colors.danger}>
        {message}
      </AppText>
      <Pressable onPress={onClear} hitSlop={10}>
        <Ionicons name="close" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.danger + '15',
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  text: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 13,
    fontWeight: '500',
  },
});
