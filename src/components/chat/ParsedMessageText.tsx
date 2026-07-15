import React from 'react';
import { StyleSheet, Linking, Platform } from 'react-native';
import ParsedText from 'react-native-parsed-text';
import { colors, typography } from '@/src/theme';

type ParsedMessageTextProps = {
  children: string;
  mine: boolean;
  color?: string;
  variant?: keyof typeof typography;
};

export default function ParsedMessageText({
  children,
  mine,
  color,
  variant = 'body',
}: ParsedMessageTextProps) {
  const handleUrlPress = (url: string) => {
    let formattedUrl = url;
    if (!/^(f|ht)tps?:\/\//i.test(url)) {
      formattedUrl = `https://${url}`;
    }
    Linking.openURL(formattedUrl).catch((err) => console.error('An error occurred', err));
  };

  // Define patterns for formatting
  // WhatsApp-style: *bold*, _italic_, ~strikethrough~, ```monospace```
  const parsePatterns = [
    {
      type: 'url' as const,
      style: [styles.url, mine && styles.mineUrl],
      onPress: handleUrlPress,
    },
    {
      pattern: /\*(.*?)\*/,
      style: styles.bold,
      renderText: (matchingString: string, matches: string[]) => matches[1],
    },
    {
      pattern: /_(.*?)_/,
      style: styles.italic,
      renderText: (matchingString: string, matches: string[]) => matches[1],
    },
    {
      pattern: /~(.*?)~/,
      style: styles.strikethrough,
      renderText: (matchingString: string, matches: string[]) => matches[1],
    },
    {
      pattern: /```([\s\S]*?)```/,
      style: styles.monospace,
      renderText: (matchingString: string, matches: string[]) => matches[1],
    },
  ];

  const defaultColor = color || (mine ? colors.surface : colors.textPrimary);

  return (
    <ParsedText
      style={[
        typography[variant],
        styles.text,
        { color: defaultColor },
      ]}
      parse={parsePatterns}
      childrenProps={{ allowFontScaling: false }}
    >
      {children}
    </ParsedText>
  );
}

const styles = StyleSheet.create({
  text: {
    includeFontPadding: false,
    fontSize: 16,
    lineHeight: 22,
  },
  url: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  mineUrl: {
    color: colors.surface,
    textDecorationLine: 'underline',
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  monospace: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
