import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

type AppCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function AppCard({ children, style }: AppCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
