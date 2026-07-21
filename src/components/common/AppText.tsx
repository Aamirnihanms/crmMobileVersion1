import { StyleSheet, Text, TextProps } from 'react-native';
import { useAppTheme, typography } from '@/src/theme';

type AppTextProps = TextProps & {
  variant?: keyof typeof typography;
  color?: string;
};

export default function AppText({
  children,
  variant = 'body',
  color,
  style,
  ...props
}: AppTextProps) {
  const { colors } = useAppTheme();
  const resolvedColor = color || colors.textPrimary;

  return (
    <Text
      {...props}
      style={[
        styles.text,
        typography[variant],
        { color: resolvedColor },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    includeFontPadding: false,
  },
});
