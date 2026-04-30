import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type ScreenShellProps = {
  children: ReactNode;
  scroll?: boolean;
  keyboardAware?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
  backgroundColor?: string;
  extraTopPadding?: number;
};

export default function ScreenShell({
  children,
  scroll = false,
  keyboardAware = false,
  contentContainerStyle,
  style,
  edges = ['bottom'],
  backgroundColor,
  extraTopPadding = 0,
}: ScreenShellProps) {
  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  const body = keyboardAware ? (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.flex}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.safeArea,
        backgroundColor ? { backgroundColor } : null,
        extraTopPadding ? { paddingTop: extraTopPadding } : null,
        style,
      ]}
    >
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
