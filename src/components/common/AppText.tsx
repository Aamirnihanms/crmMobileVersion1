import { StyleSheet, Text, TextProps } from 'react-native';
import { colors, typography } from '../../theme';

type AppTextProps = TextProps & {
  variant?: keyof typeof typography;
  color?: string;
};

export default function AppText({
  children,
  variant = 'body',
  color = colors.textPrimary,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        styles.text,
        typography[variant],
        { color },
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
