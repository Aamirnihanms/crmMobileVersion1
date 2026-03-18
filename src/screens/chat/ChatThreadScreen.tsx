import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import AppText from '@/src/components/common/AppText';
import type { DashboardStackParamList } from '@/src/navigation/DashboardStack';
import { colors, spacing } from '@/src/theme';

type ChatThreadRouteProp = RouteProp<
  DashboardStackParamList,
  'ChatThread'
>;

type Message = {
  id: string;
  mine: boolean;
  text: string;
  time: string;
};

const initialMessages: Message[] = [
  {
    id: 'm1',
    mine: false,
    text: 'Hi! I saw your enquiry for CRM mobile demo.',
    time: '10:02',
  },
  {
    id: 'm2',
    mine: true,
    text: 'Yes, I want to understand lead tracking and followups.',
    time: '10:04',
  },
  {
    id: 'm3',
    mine: false,
    text: 'Perfect. I can share a quick walkthrough video.',
    time: '10:05',
  },
  {
    id: 'm4',
    mine: true,
    text: 'Great. Also send pricing for 10 users.',
    time: '10:06',
  },
];

function HeaderAvatar({
  label,
  avatarColor,
}: {
  label: string;
  avatarColor: string;
}) {
  return (
    <View style={[styles.headerAvatar, { backgroundColor: avatarColor }]}>
      <AppText variant="subtitle">
        {label?.trim()?.charAt(0)?.toUpperCase() || 'U'}
      </AppText>
    </View>
  );
}

export default function ChatThreadScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<ChatThreadRouteProp>();
  const { name, online, avatarColor } = params;
  const insets = useSafeAreaInsets();
  const topInset =
    Platform.OS === 'android'
      ? StatusBar.currentHeight ?? 0
      : insets.top;
  const composerBottomPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, spacing.sm)
      : spacing.sm;

  const [messages, setMessages] =
    useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `m${Date.now()}`,
        mine: true,
        text,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setInput('');
  };

  return (
    <View style={styles.safeArea}>
      <View
        style={[
          styles.threadHeader,
          { paddingTop: topInset + spacing.sm },
        ]}
      >
        <Pressable
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </Pressable>

        <HeaderAvatar label={name} avatarColor={avatarColor} />

        <View style={styles.headerTitleWrap}>
          <AppText variant="subtitle" color="#FFFFFF">
            {name}
          </AppText>
          <AppText
            variant="caption"
            color="#DCFCE7"
            style={styles.statusText}
          >
            {online ? 'Online' : 'last seen recently'}
          </AppText>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="call-outline" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="videocam-outline" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatBody}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.messagesArea}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubbleRow,
                  item.mine && styles.mineRow,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    item.mine ? styles.myBubble : styles.theirBubble,
                  ]}
                >
                  <AppText color={colors.textPrimary}>{item.text}</AppText>
                  <View style={styles.metaRow}>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {item.time}
                    </AppText>
                    {item.mine ? (
                      <Ionicons
                        name="checkmark-done"
                        size={12}
                        color="#2563EB"
                      />
                    ) : null}
                  </View>
                </View>
              </View>
            )}
          />
        </View>

        <View
          style={[
            styles.composerWrap,
            { paddingBottom: composerBottomPadding },
          ]}
        >
          <Pressable style={styles.attachButton}>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>

          <View style={styles.composerInputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message"
              placeholderTextColor={colors.textMuted}
              style={styles.composerInput}
              multiline
            />
            <Pressable style={styles.smallAction}>
              <Ionicons
                name="camera-outline"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          <Pressable style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatBody: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#1F8E5D',
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  statusText: {
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  messagesArea: {
    flex: 1,
    backgroundColor: '#EFEAE2',
  },
  messagesList: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  mineRow: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  myBubble: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  composerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: spacing.sm,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  composerInputWrap: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  composerInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
    maxHeight: 96,
  },
  smallAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F8E5D',
  },
});
