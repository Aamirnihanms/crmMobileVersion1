import { Ionicons } from '@expo/vector-icons';
import {
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createMessage,
  deleteChatMessage,
  generatePresignedUploadUrl,
  getUploadedFileUrl,
  markMessagesRead,
  uploadFileToPresignedPost,
  type ApiMessage,
  type PresignedUploadFile,
} from '@/src/api/chat.api';
import { http } from '@/src/api/http';
import AppText from '@/src/components/common/AppText';
import { useChatWebSocket, type ChatWsEvent } from '@/src/hooks/useChatWebSocket';
import type { DashboardStackParamList } from '@/src/navigation/DashboardStack';
import { useInfiniteChatMessages } from '@/src/queries/chat.query';
import { useAuthStore } from '@/src/store/auth.store';
import { colors, spacing } from '@/src/theme';
import { getToken } from '@/src/utils/token';

type ChatThreadRouteProp = RouteProp<
  DashboardStackParamList,
  'ChatThread'
>;

type ReplyPreview = {
  id: string;
  senderName: string;
  text: string;
  messageType: string;
};

type ThreadMessage = {
  id: string;
  mine: boolean;
  text: string;
  time: string;
  status?: 'sending' | 'delivered' | 'read' | 'failed';
  messageType: string;
  fileUrl?: string | null;
  fileName?: string | null;
  senderName?: string;
  senderAvatar?: string | null;
  replyPreview?: ReplyPreview | null;
  raw: ApiMessage;
};

type ImagePreview = {
  uri: string;
  name?: string | null;
};

type PendingAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  isImage: boolean;
};

const getThreadMessageSortValue = (message: ThreadMessage) => {
  const createdAt = message?.raw?.created_at;
  if (typeof createdAt === 'string') {
    const parsed = Date.parse(createdAt);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const tempTimestamp = Number(String(message.id).replace(/\D/g, ''));
  if (!Number.isNaN(tempTimestamp) && tempTimestamp > 0) {
    return tempTimestamp;
  }

  return 0;
};

const DELETED_MESSAGE_TEXT = 'This message was deleted';

const formatTime = (rawValue?: string | null) => {
  if (!rawValue) return '';
  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toAbsoluteUrl = (rawUrl?: string | null) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const normalized = rawUrl.trim();
  if (!normalized) return null;

  if (/^(https?:|file:|content:|data:)/i.test(normalized)) {
    return normalized;
  }

  const base = typeof http.defaults.baseURL === 'string'
    ? http.defaults.baseURL
    : '';
  if (!base) return normalized;

  try {
    const parsedBase = new URL(base);
    if (normalized.startsWith('/')) {
      const origin = `${parsedBase.protocol}//${parsedBase.host}`;
      return new URL(normalized, origin).toString();
    }
    const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
    return new URL(normalized, baseWithSlash).toString();
  } catch {
    return normalized;
  }
};

const getAttachmentUrl = (msg?: ApiMessage | null) => {
  if (!msg) return null;
  const value =
    (typeof msg.file_url === 'string' && msg.file_url) ||
    (typeof msg.file === 'string' && msg.file) ||
    (typeof msg.attachment_url === 'string' && msg.attachment_url) ||
    (typeof msg.url === 'string' && msg.url) ||
    null;
  return toAbsoluteUrl(value);
};

const getAttachmentFileName = (msg?: ApiMessage | null) => {
  if (!msg) return null;
  const explicitName =
    (typeof msg.file_name === 'string' && msg.file_name) ||
    (typeof msg.filename === 'string' && msg.filename) ||
    null;
  if (explicitName) return explicitName;

  const url = getAttachmentUrl(msg);
  if (!url) return null;

  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split('/').pop() || 'attachment');
  } catch {
    return 'attachment';
  }
};

const isMessageDeleted = (msg?: ApiMessage | null) =>
  Boolean(msg?.deleted_at || msg?.is_deleted);

const getMessageSummary = (msg?: ApiMessage | null) => {
  if (!msg) return '';
  if (isMessageDeleted(msg)) return DELETED_MESSAGE_TEXT;

  const text = typeof msg.content === 'string' ? msg.content.trim() : '';
  if (text) return text;

  const messageType = msg.message_type || 'text';
  if (messageType === 'image') return 'Image';
  if (messageType === 'audio') return 'Voice message';
  if (messageType === 'file') {
    return getAttachmentFileName(msg) || 'Attachment';
  }
  return '';
};

const normalizeMessageType = (msg: ApiMessage) => {
  const originalType = msg.message_type || 'text';
  if (originalType === 'file') {
    const contentType =
      typeof msg.content_type === 'string' ? msg.content_type.toLowerCase() : '';
    if (contentType.startsWith('image/')) {
      return 'image';
    }

    const name = String(
      getAttachmentFileName(msg) || getAttachmentUrl(msg) || ''
    ).toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) {
      return 'image';
    }
  }
  return originalType;
};

const shouldShowMessageText = (message: ThreadMessage) => {
  if (isMessageDeleted(message.raw)) return true;

  const text = message.text.trim();
  if (!text) return false;

  if (message.messageType === 'image') {
    const normalized = text.toLowerCase();
    return normalized !== 'image' && normalized !== 'image attachment';
  }

  if (message.messageType === 'file') {
    const normalized = text.toLowerCase();
    const fileName = (message.fileName || '').trim().toLowerCase();
    if (normalized === fileName) return false;
    return normalized !== 'attachment' && normalized !== 'file attachment';
  }

  return true;
};

const areReplyPreviewsEqual = (
  a?: ReplyPreview | null,
  b?: ReplyPreview | null
) =>
  a?.id === b?.id &&
  a?.senderName === b?.senderName &&
  a?.text === b?.text &&
  a?.messageType === b?.messageType;

const areThreadMessagesEqual = (a: ThreadMessage, b: ThreadMessage) =>
  a.id === b.id &&
  a.mine === b.mine &&
  a.text === b.text &&
  a.time === b.time &&
  a.status === b.status &&
  a.messageType === b.messageType &&
  a.fileUrl === b.fileUrl &&
  a.fileName === b.fileName &&
  areReplyPreviewsEqual(a.replyPreview, b.replyPreview) &&
  a.raw?.is_deleted === b.raw?.is_deleted &&
  a.raw?.deleted_at === b.raw?.deleted_at &&
  a.raw?.is_edited === b.raw?.is_edited &&
  a.raw?.content === b.raw?.content &&
  a.raw?.created_at === b.raw?.created_at;

const buildReplyPreviewFromApi = (msg: ApiMessage): ReplyPreview | null => {
  const replyToContent = msg.reply_to_content;
  if (replyToContent && typeof replyToContent === 'object') {
    const replyRaw = replyToContent as Record<string, unknown>;
    const senderRaw = replyRaw.sender;
    const senderName =
      (typeof senderRaw === 'string' && senderRaw) ||
      (typeof senderRaw === 'object' && senderRaw &&
        (String((senderRaw as Record<string, unknown>).full_name || '') ||
          String((senderRaw as Record<string, unknown>).name || '') ||
          String((senderRaw as Record<string, unknown>).displayName || ''))) ||
      'Unknown';

    return {
      id: String(replyRaw.uid || replyRaw.id || msg.reply_to || ''),
      senderName,
      text:
        typeof replyRaw.content === 'string'
          ? replyRaw.content
          : typeof replyRaw.text === 'string'
            ? replyRaw.text
            : 'Replied message',
      messageType:
        typeof replyRaw.message_type === 'string'
          ? replyRaw.message_type
          : 'text',
    };
  }

  if (msg.reply_to && typeof msg.reply_to === 'object') {
    const rawReply = msg.reply_to as Record<string, unknown>;
    const senderRaw = rawReply.sender;
    const senderName =
      (typeof senderRaw === 'string' && senderRaw) ||
      (typeof senderRaw === 'object' && senderRaw &&
        (String((senderRaw as Record<string, unknown>).full_name || '') ||
          String((senderRaw as Record<string, unknown>).name || '') ||
          String((senderRaw as Record<string, unknown>).displayName || ''))) ||
      'Unknown';

    return {
      id: String(rawReply.uid || rawReply.id || ''),
      senderName,
      text:
        typeof rawReply.content === 'string'
          ? rawReply.content
          : typeof rawReply.text === 'string'
            ? rawReply.text
            : 'Replied message',
      messageType:
        typeof rawReply.message_type === 'string'
          ? rawReply.message_type
          : 'text',
    };
  }

  if (typeof msg.reply_to === 'string') {
    return {
      id: msg.reply_to,
      senderName: 'Reply',
      text: 'Replied message',
      messageType: 'text',
    };
  }

  return null;
};

const decodeJwtPayload = (token: string) => {
  try {
    if (typeof globalThis.atob !== 'function') return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(
        base64Url.length + ((4 - (base64Url.length % 4)) % 4),
        '='
      );

    const decoded = globalThis.atob(base64);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

function HeaderAvatar({
  label,
  avatarColor,
  uri,
}: {
  label: string;
  avatarColor: string;
  uri?: string | null;
}) {
  return (
    <View style={[styles.headerAvatar, { backgroundColor: colors.primaryLight + '50' }]}>
      {uri ? (
        <ExpoImage
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <AppText variant="subtitle" color={colors.primary}>
          {label?.trim()?.charAt(0)?.toUpperCase() || 'U'}
        </AppText>
      )}
    </View>
  );
}

type MessageRowProps = {
  item: ThreadMessage;
  onLongPress: (message: ThreadMessage) => void;
  onReply: (message: ThreadMessage) => void;
  onAttachmentPress: (message: ThreadMessage) => void;
  showSenderInfo?: boolean;
};

const MessageRow = memo(function MessageRow({
  item,
  onLongPress,
  onReply,
  onAttachmentPress,
  showSenderInfo,
}: MessageRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderLeftActions = useCallback(
    (_progress: any, dragX: any) => {
      const trans = dragX.interpolate({
        inputRange: [0, 60, 90],
        outputRange: [-30, 0, 0],
      });
      const opacity = dragX.interpolate({
        inputRange: [0, 60],
        outputRange: [0, 1],
      });
      const scale = dragX.interpolate({
        inputRange: [0, 60, 90],
        outputRange: [0.3, 1, 1.2],
      });

      return (
        <View style={styles.swipeActionContainer}>
          <Animated.View style={[styles.swipeActionView, { opacity, transform: [{ translateX: trans }, { scale }] }]}>
            <Ionicons name="arrow-undo-outline" size={24} color={colors.primary} />
          </Animated.View>
        </View>
      );
    },
    []
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableWillOpen={(direction) => {
        if (direction === 'left') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onReply(item);
        }
        setTimeout(() => swipeableRef.current?.close(), 0);
      }}
      friction={2}
      leftThreshold={60}
    >
      <Pressable
        onLongPress={() => onLongPress(item)}
        style={[
          styles.bubbleRow,
          item.mine && styles.mineRow,
        ]}
      >
        {showSenderInfo && !item.mine ? (
          <View style={styles.avatarContainer}>
            {item.senderAvatar ? (
              <ExpoImage
                source={{ uri: item.senderAvatar }}
                style={styles.senderAvatar}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                style={[
                  styles.senderAvatar,
                  {
                    backgroundColor: colors.primaryLight + '30',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <Ionicons name="person" size={12} color={colors.primary} />
              </View>
            )}
          </View>
        ) : null}

        <View
          style={[
            styles.bubble,
            item.mine ? styles.myBubble : styles.theirBubble,
            item.mine ? styles.myBubbleShadow : styles.theirBubbleShadow,
          ]}
        >
          {showSenderInfo && item.senderName && !item.mine ? (
            <AppText
              variant="caption"
              color={colors.primary}
              style={styles.senderName}
              numberOfLines={1}
            >
              {item.senderName}
            </AppText>
          ) : null}
          {item.replyPreview ? (
            <View style={[
              styles.replyPreviewBox,
              { borderLeftColor: item.mine ? '#FFFFFF88' : colors.primary }
            ]}>
              <AppText
                variant="caption"
                color={item.mine ? '#FFFFFF' : colors.primary}
                numberOfLines={1}
                style={{ fontWeight: '700' }}
              >
                {item.replyPreview.senderName}
              </AppText>
              <AppText
                variant="caption"
                color={item.mine ? '#FFFFFFEE' : colors.textSecondary}
                numberOfLines={1}
              >
                {item.replyPreview.messageType === 'image'
                  ? 'Image'
                  : item.replyPreview.messageType === 'file'
                    ? 'Attachment'
                    : item.replyPreview.text}
              </AppText>
            </View>
          ) : null}

          {item.messageType === 'image' || item.messageType === 'file' ? (
            <Pressable onPress={() => onAttachmentPress(item)}>
              {item.messageType === 'image' && item.fileUrl ? (
                <View style={styles.imageBubbleWrap}>
                  <ExpoImage
                    source={{ uri: item.fileUrl }}
                    style={styles.imageBubble}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={120}
                  />
                  <View style={styles.imagePreviewHint}>
                    <Ionicons
                      name="expand-outline"
                      size={13}
                      color="#FFFFFF"
                    />
                    <AppText variant="caption" color="#FFFFFF">
                      Tap to view
                    </AppText>
                  </View>
                </View>
              ) : (
                <View style={[
                  styles.fileCard,
                  item.mine && { backgroundColor: '#FFFFFF20', borderColor: '#FFFFFF40' }
                ]}>
                  <Ionicons
                    name="document-attach-outline"
                    size={16}
                    color={item.mine ? '#FFFFFF' : colors.textSecondary}
                  />
                  <AppText
                    style={styles.fileName}
                    color={item.mine ? '#FFFFFF' : colors.textPrimary}
                    numberOfLines={1}
                    variant="caption"
                  >
                    {item.fileName || 'Attachment'}
                  </AppText>
                </View>
              )}
            </Pressable>
          ) : null}

          {shouldShowMessageText(item) ? (
            <AppText color={item.mine ? '#FFFFFF' : colors.textPrimary}>{item.text}</AppText>
          ) : null}
          <View style={styles.metaRow}>
            <AppText
              variant="caption"
              color={item.mine ? '#FFFFFFCC' : colors.textMuted}
              style={{ fontSize: 10 }}
            >
              {item.time}
            </AppText>
            {item.mine ? (
              <Ionicons
                name={
                  item.status === 'sending'
                    ? 'time-outline'
                    : item.status === 'failed'
                      ? 'alert-circle-outline'
                      : 'checkmark-done'
                }
                size={12}
                color={
                  item.status === 'failed'
                    ? '#FFDADA'
                    : item.status === 'read'
                      ? '#FFFFFF'
                      : '#FFFFFFCC'
                }
              />
            ) : null}
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}, (prev, next) =>
  prev.onLongPress === next.onLongPress &&
  prev.onReply === next.onReply &&
  prev.onAttachmentPress === next.onAttachmentPress &&
  areThreadMessagesEqual(prev.item, next.item)
);

export default function ChatThreadScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const { params } = useRoute<ChatThreadRouteProp>();
  const {
    chatId,
    name,
    online,
    avatarColor,
    profilePic,
    participantId,
    chatType = 'individual',
  } = params;

  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ThreadMessage>>(null);

  const topInset =
    Platform.OS === 'android'
      ? StatusBar.currentHeight ?? 0
      : insets.top;

  const composerBottomPadding = Math.max(insets.bottom, 8);

  const [token, setToken] = useState('');
  const [currentUserId, setCurrentUserId] =
    useState<string | number | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ThreadMessage | null>(null);
  const [messageMenuVisible, setMessageMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ThreadMessage | null>(null);
  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const markedReadRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const loadAuthContext = async () => {
      const authToken = await getToken();
      if (!authToken || !isMounted) return;

      setToken(authToken);
      const payload = decodeJwtPayload(authToken);
      const id =
        (payload?.user_id as string | number | undefined) ||
        (payload?.id as string | number | undefined) ||
        null;
      setCurrentUserId(id);
    };

    void loadAuthContext();
    return () => {
      isMounted = false;
    };
  }, []);

  const isReadByMe = useCallback(
    (msg: ApiMessage) => {
      const readBy = Array.isArray(msg.read_by) ? msg.read_by : [];
      if (user?.uid) {
        if (readBy.some((value) => String(value) === String(user.uid))) {
          return true;
        }
      }
      if (currentUserId !== null) {
        return readBy.some(
          (value) => String(value) === String(currentUserId)
        );
      }
      return false;
    },
    [currentUserId, user?.uid]
  );

  const isMineMessage = useCallback(
    (msg: ApiMessage) => {
      const sender = msg.sender || {};
      if (user?.uid && sender.uid && sender.uid === user.uid) return true;

      if (currentUserId !== null && sender.id !== undefined) {
        if (String(sender.id) === String(currentUserId)) return true;
      }

      if (
        chatType === 'individual' &&
        participantId !== undefined &&
        participantId !== null &&
        sender.id !== undefined
      ) {
        return sender.id !== participantId;
      }

      return false;
    },
    [chatType, currentUserId, participantId, user?.uid]
  );

  const mapApiMessage = useCallback(
    (msg: ApiMessage): ThreadMessage => {
      const mine = isMineMessage(msg);
      const messageType = normalizeMessageType(msg);
      const readBy = Array.isArray(msg.read_by) ? msg.read_by : [];

      return {
        id: msg.uid,
        mine,
        text: getMessageSummary(msg),
        time: formatTime(msg.created_at),
        status: mine ? (readBy.length > 0 ? 'read' : 'delivered') : undefined,
        messageType,
        fileUrl: getAttachmentUrl(msg),
        fileName: getAttachmentFileName(msg),
        senderName:
          (typeof msg.sender === 'string' ? msg.sender : msg.sender?.full_name || msg.sender?.name) || undefined,
        senderAvatar: (msg.sender && typeof msg.sender === 'object' ? msg.sender.profile_pic : null) || null,
        replyPreview: buildReplyPreviewFromApi(msg),
        raw: msg,
      };
    },
    [isMineMessage]
  );
  const syncMessageToCache = useCallback((msg: ApiMessage) => {
    queryClient.setQueryData(['chat-messages', chatId], (old: any) => {
      if (!old?.pages?.length) return old;
      const newPages = [...old.pages];
      // API returns newest first. We add the newest message at the top of the first page.
      newPages[0] = {
        ...newPages[0],
        messages: [msg, ...(newPages[0].messages || [])],
      };
      return { ...old, pages: newPages };
    });
  }, [chatId, queryClient]);

  const {
    data: messagesQueryData,
    isLoading: messagesLoading,
    isRefetching: messagesRefetching,
    isFetchingNextPage: fetchingOlderMessages,
    hasNextPage: hasOlderMessages,
    fetchNextPage: fetchOlderMessages,
    refetch: refetchMessages,
    error: messagesQueryError,
  } = useInfiniteChatMessages(chatId, 50, Boolean(chatId));

  const queryMessages = useMemo(() => {
    if (!messagesQueryData?.pages?.length) return [];

    // Pages are returned newest-first (Page 1 = messages 100-50, Page 2 = 50-0)
    // We want to reverse pages so we have [OlderPage, NewerPage]
    // Then reverse messages in each page so we have [OlderMessage, NewerMessage]
    return [...messagesQueryData.pages]
      .reverse()
      .flatMap((page) => {
        if (!Array.isArray(page.messages)) return [];
        return [...page.messages].reverse();
      })
      .map(mapApiMessage);
  }, [mapApiMessage, messagesQueryData]);

  const messagesLoadError = useMemo(() => {
    const err = messagesQueryError as any;
    if (!err) return null;
    return (
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      'Failed to load messages'
    );
  }, [messagesQueryError]);

  useEffect(() => {
    markedReadRef.current.clear();
    setMessages([]);
  }, [chatId]);

  useEffect(() => {
    if (isFocused && chatId) {
      void refetchMessages();
    }
  }, [chatId, isFocused, refetchMessages]);

  useEffect(() => {
    if (!queryMessages.length) {
      setMessages((prev) =>
        prev.filter(
          (message) =>
            message.status === 'sending' || message.status === 'failed'
        )
      );
      return;
    }

    setMessages((prev) => {
      const previousMap = new Map(prev.map((msg) => [msg.id, msg]));

      // 1. Map server messages and mark them as removed from the 'previousMap'
      const mergedFromServer = queryMessages.map((serverMsg) => {
        const localMsg = previousMap.get(serverMsg.id);
        previousMap.delete(serverMsg.id);

        if (!localMsg) return serverMsg;

        // Maintain local-only state like 'read' during server sync
        return {
          ...serverMsg,
          status: localMsg.status === 'read' ? 'read' : serverMsg.status,
        };
      });

      // 2. Filter remaining local messages for those that are still 'sending' or 'failed'
      const optimisticOnly = [...previousMap.values()].filter(
        (msg) => msg.status === 'sending' || msg.status === 'failed'
      );

      // 3. Combine and sort ascending (oldest first, newest last)
      return [...mergedFromServer, ...optimisticOnly].sort(
        (a, b) => getThreadMessageSortValue(a) - getThreadMessageSortValue(b)
      );
    });
  }, [queryMessages]);

  useEffect(() => {
    if (messages.length > 0 && isFocused) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isFocused]);

  const latestMessagePage = useMemo(
    () =>
      Array.isArray(messagesQueryData?.pages?.[0]?.messages)
        ? (messagesQueryData?.pages?.[0]?.messages as ApiMessage[])
        : [],
    [messagesQueryData]
  );

  useEffect(() => {
    if (!latestMessagePage.length) return;

    const unreadUids = latestMessagePage
      .filter((msg) => !isMineMessage(msg))
      .filter((msg) => !isReadByMe(msg))
      .map((msg) => msg.uid)
      .filter((uid): uid is string => {
        if (!uid || markedReadRef.current.has(uid)) return false;
        return true;
      });

    if (!unreadUids.length) return;

    unreadUids.forEach((uid) => markedReadRef.current.add(uid));
    void markMessagesRead(chatId, unreadUids).catch(() => {
      unreadUids.forEach((uid) => markedReadRef.current.delete(uid));
    });
  }, [chatId, isMineMessage, isReadByMe, latestMessagePage]);

  const upsertIncomingMessage = useCallback(
    (msg: ApiMessage) => {
      const mapped = mapApiMessage(msg);
      setMessages((prev) => {
        const exists = prev.some((item) => item.id === mapped.id);
        if (exists) return prev;
        return [...prev, mapped];
      });
    },
    [mapApiMessage]
  );

  const handleWsMessage = useCallback(
    async (event: ChatWsEvent) => {
      const type = event.type;

      if (type === 'new_message' || type === 'queued_message') {
        const rawMessage =
          type === 'queued_message' && event.message
            ? (event.message as ApiMessage)
            : (event as ApiMessage);

        const incomingChatUid =
          (rawMessage.chat_uid as string | undefined) ||
          (rawMessage.chat as string | undefined) ||
          '';

        if (!incomingChatUid || incomingChatUid !== chatId) return;
        if (!rawMessage.uid) return;

        upsertIncomingMessage(rawMessage);

        if (!isMineMessage(rawMessage)) {
          try {
            await markMessagesRead(chatId, [rawMessage.uid]);
          } catch {
            // ignore
          }
        }

        return;
      }

      if (type === 'message_deleted' || type === 'deleted_message') {
        const messageUid =
          (event.message_uid as string | undefined) ||
          (event.uid as string | undefined) ||
          '';
        const incomingChatUid =
          (event.chat_uid as string | undefined) ||
          (event.chat as string | undefined) ||
          '';

        if (!messageUid || incomingChatUid !== chatId) return;

        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== messageUid) return message;
            const nextRaw = {
              ...message.raw,
              deleted_at:
                (event.deleted_at as string | undefined) ||
                message.raw.deleted_at ||
                null,
              is_deleted: true,
            };
            return {
              ...message,
              text: DELETED_MESSAGE_TEXT,
              messageType: 'text',
              fileUrl: null,
              fileName: null,
              raw: nextRaw,
            };
          })
        );
        return;
      }

      if (type === 'message_edited') {
        const messageUid =
          (event.message_uid as string | undefined) ||
          (event.message &&
            typeof event.message === 'object' &&
            typeof (event.message as Record<string, unknown>).uid === 'string'
            ? ((event.message as Record<string, unknown>).uid as string)
            : '') ||
          '';

        const incomingChatUid =
          (event.chat_uid as string | undefined) ||
          (event.chat as string | undefined) ||
          '';

        if (!messageUid || incomingChatUid !== chatId) return;

        const content =
          (event.content as string | undefined) ||
          (event.message &&
            typeof event.message === 'object' &&
            typeof (event.message as Record<string, unknown>).content === 'string'
            ? ((event.message as Record<string, unknown>).content as string)
            : '') ||
          '';

        if (!content) return;

        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== messageUid) return message;
            return {
              ...message,
              text: content,
              raw: {
                ...message.raw,
                content,
                is_edited: true,
              },
            };
          })
        );
        return;
      }

      if (type === 'messages_read') {
        const incomingChatUid =
          (event.chat_uid as string | undefined) ||
          (event.chat as string | undefined) ||
          '';

        if (incomingChatUid !== chatId) return;

        const readMessageUids =
          Array.isArray(event.message_uids) &&
            event.message_uids.every((uid) => typeof uid === 'string')
            ? (event.message_uids as string[])
            : [];

        if (!readMessageUids.length) return;

        setMessages((prev) =>
          prev.map((message) => {
            if (!message.mine) return message;
            if (!readMessageUids.includes(message.id)) return message;
            return {
              ...message,
              status: 'read',
            };
          })
        );
      }
    },
    [chatId, isMineMessage, upsertIncomingMessage]
  );

  const {
    isConnected: wsConnected,
    joinChat,
    leaveChat,
  } = useChatWebSocket({
    token,
    enabled: Boolean(token),
    onMessage: handleWsMessage,
  });

  useEffect(() => {
    if (!wsConnected) return;
    joinChat(chatId);

    return () => {
      leaveChat(chatId);
    };
  }, [chatId, joinChat, leaveChat, wsConnected]);

  const replyComposerText = useMemo(() => {
    if (!replyingTo) return '';
    if (replyingTo.messageType === 'image') return 'Image';
    if (replyingTo.messageType === 'file') return replyingTo.fileName || 'Attachment';
    return replyingTo.text || 'Message';
  }, [replyingTo]);

  const sendTextMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ThreadMessage = {
      id: tempId,
      mine: true,
      text,
      time: formatTime(new Date().toISOString()),
      status: 'sending',
      messageType: 'text',
      replyPreview: replyingTo
        ? {
          id: replyingTo.id,
          senderName: replyingTo.mine ? 'You' : (replyingTo.senderName || name),
          text: replyComposerText,
          messageType: replyingTo.messageType,
        }
        : null,
      raw: {
        uid: tempId,
        content: text,
        message_type: 'text',
        reply_to: replyingTo?.id || null,
      },
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setReplyingTo(null);

    try {
      setSending(true);
      const payload: Record<string, unknown> = {
        content: text,
        message_type: 'text',
      };
      if (optimistic.replyPreview?.id) {
        payload.reply_to = optimistic.replyPreview.id;
      }

      const response = await createMessage(chatId, payload);

      const confirmed = response?.message as ApiMessage | undefined;

      if (confirmed?.uid) {
        const mapped = mapApiMessage(confirmed);
        syncMessageToCache(confirmed);
        setMessages((prev) => {
          const withoutTemp = prev.filter((message) => message.id !== tempId);
          const exists = withoutTemp.some((message) => message.id === mapped.id);
          return exists ? withoutTemp : [...withoutTemp, mapped];
        });
      } else {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempId
              ? { ...message, status: 'delivered' }
              : message
          )
        );
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to send message';

      setMessages((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, status: 'failed' } : item
        )
      );
      Alert.alert('Send failed', message);
    } finally {
      setSending(false);
    }
  }, [
    chatId,
    input,
    mapApiMessage,
    name,
    replyComposerText,
    replyingTo,
    sending,
  ]);

  const pickAttachment = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: '*/*',
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const mimeType = file.mimeType || 'application/octet-stream';

      setPendingAttachment({
        uri: file.uri,
        name: file.name,
        mimeType,
        size: file.size,
        isImage: mimeType.startsWith('image/'),
      });
    } catch {
      Alert.alert('Attachment', 'Unable to pick file.');
    }
  }, []);

  const sendAttachmentMessage = useCallback(async () => {
    if (!pendingAttachment || sending) return;

    const caption = input.trim();
    const tempId = `temp-file-${Date.now()}`;
    const messageType = pendingAttachment.isImage ? 'image' : 'file';

    const optimistic: ThreadMessage = {
      id: tempId,
      mine: true,
      text: caption || (pendingAttachment.isImage ? 'Image' : 'Attachment'),
      time: formatTime(new Date().toISOString()),
      status: 'sending',
      messageType,
      fileUrl: pendingAttachment.uri,
      fileName: pendingAttachment.name,
      replyPreview: replyingTo
        ? {
          id: replyingTo.id,
          senderName: replyingTo.mine ? 'You' : (replyingTo.senderName || name),
          text: replyComposerText,
          messageType: replyingTo.messageType,
        }
        : null,
      raw: {
        uid: tempId,
        content: caption || (pendingAttachment.isImage ? 'Image' : 'Attachment'),
        message_type: messageType,
        file_name: pendingAttachment.name,
        file_url: pendingAttachment.uri,
      },
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setReplyingTo(null);
    setPendingAttachment(null);

    try {
      setSending(true);

      const presigned = await generatePresignedUploadUrl({
        file_name: pendingAttachment.name,
        folder: 'chat',
      });

      if (!presigned?.success) {
        throw new Error('Unable to generate upload URL');
      }

      const uploadFile: PresignedUploadFile = {
        uri: pendingAttachment.uri,
        name: pendingAttachment.name,
        type: pendingAttachment.mimeType,
      };

      await uploadFileToPresignedPost(presigned, uploadFile);

      const uploadedUrl = getUploadedFileUrl(presigned);
      if (!uploadedUrl) {
        throw new Error('Uploaded URL missing');
      }

      const payload: Record<string, unknown> = {
        content:
          caption ||
          (pendingAttachment.isImage ? 'Image attachment' : 'File attachment'),
        message_type: messageType,
        file_url: uploadedUrl,
        file: uploadedUrl,
        attachment_url: uploadedUrl,
        file_name: pendingAttachment.name,
        original_filename: pendingAttachment.name,
        s3_key: presigned.s3_key,
        content_type: pendingAttachment.mimeType,
      };

      if (optimistic.replyPreview?.id) {
        payload.reply_to = optimistic.replyPreview.id;
      }

      const response = await createMessage(chatId, payload);

      const confirmed = response?.message as ApiMessage | undefined;

      if (confirmed?.uid) {
        const mapped = mapApiMessage(confirmed);
        syncMessageToCache(confirmed);
        setMessages((prev) => {
          const withoutTemp = prev.filter((message) => message.id !== tempId);
          const exists = withoutTemp.some((message) => message.id === mapped.id);
          if (exists) return withoutTemp;
          return [...withoutTemp, mapped];
        });
      } else {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempId
              ? {
                ...message,
                status: 'delivered',
                fileUrl: uploadedUrl,
              }
              : message
          )
        );
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to send attachment';

      setMessages((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, status: 'failed' } : item
        )
      );
      Alert.alert('Attachment failed', message);
    } finally {
      setSending(false);
    }
  }, [
    chatId,
    input,
    mapApiMessage,
    name,
    pendingAttachment,
    replyComposerText,
    replyingTo,
    sending,
  ]);

  const handleSend = useCallback(() => {
    if (pendingAttachment) {
      void sendAttachmentMessage();
      return;
    }
    void sendTextMessage();
  }, [pendingAttachment, sendAttachmentMessage, sendTextMessage]);

  const openAttachmentUrl = useCallback(async (url?: string | null) => {
    if (!url) {
      Alert.alert('Attachment', 'No file URL found for this attachment.');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Attachment', 'Unable to open this attachment.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Attachment', 'Unable to open this attachment.');
    }
  }, []);

  const handleAttachmentPress = useCallback(
    (message: ThreadMessage) => {
      if (!message.fileUrl) {
        Alert.alert('Attachment', 'No file URL found for this attachment.');
        return;
      }

      if (message.messageType === 'image') {
        setImagePreview({
          uri: message.fileUrl,
          name: message.fileName,
        });
        return;
      }

      void openAttachmentUrl(message.fileUrl);
    },
    [openAttachmentUrl]
  );

  const keyExtractor = useCallback((item: ThreadMessage) => item.id, []);

  const handleMessageLongPress = useCallback((message: ThreadMessage) => {
    setSelectedMessage(message);
    setMessageMenuVisible(true);
  }, []);

  const handleMenuReply = useCallback(() => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
    }
    setMessageMenuVisible(false);
    setSelectedMessage(null);
  }, [selectedMessage]);

  const handleDeleteMessage = useCallback(async () => {
    if (!selectedMessage || !chatId) return;

    const messageUid = selectedMessage.id;
    try {
      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageUid
            ? {
              ...msg,
              raw: {
                ...msg.raw,
                is_deleted: true,
                deleted_at: new Date().toISOString(),
              },
              text: DELETED_MESSAGE_TEXT,
            }
            : msg
        )
      );

      await deleteChatMessage(chatId, messageUid);
      void refetchMessages();
    } catch {
      Alert.alert('Error', 'Failed to delete message');
      void refetchMessages();
    } finally {
      setMessageMenuVisible(false);
      setSelectedMessage(null);
    }
  }, [selectedMessage, chatId, refetchMessages]);

  const renderMessageItem = useCallback(({ item }: ListRenderItemInfo<ThreadMessage>) => (
    <MessageRow
      item={item}
      onLongPress={handleMessageLongPress}
      onReply={setReplyingTo}
      onAttachmentPress={handleAttachmentPress}
      showSenderInfo={!item.mine && (chatType === 'group' || chatType === 'batch')}
    />
  ), [chatType, handleAttachmentPress, handleMessageLongPress]);

  const loadOlderMessages = useCallback(() => {
    if (!hasOlderMessages || fetchingOlderMessages) return;
    void fetchOlderMessages();
  }, [fetchOlderMessages, fetchingOlderMessages, hasOlderMessages]);

  const renderMessagesFooter = useCallback(
    () =>
      fetchingOlderMessages ? (
        <View style={styles.paginationLoader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null,
    [fetchingOlderMessages]
  );

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      {messagesLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <AppText color={colors.textSecondary}>
          {messagesLoadError || 'No messages yet'}
        </AppText>
      )}
    </View>
  ), [messagesLoadError, messagesLoading]);

  return (
    <View style={styles.safeArea}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.threadHeader,
          { paddingTop: topInset + spacing.xs },
        ]}
      >
        <Pressable
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <HeaderAvatar label={name} avatarColor={avatarColor} uri={profilePic} />

        <View style={styles.headerTitleWrap}>
          <AppText variant="subtitle" color="#FFFFFF" style={{ fontWeight: '800' }}>
            {name}
          </AppText>
          <AppText
            variant="caption"
            color="rgba(255,255,255,0.85)"
            style={styles.statusText}
          >
            {online ? 'Online' : 'Last seen recently'}
          </AppText>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="call-outline" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>

      <Modal
        transparent
        visible={messageMenuVisible}
        animationType="fade"
        onRequestClose={() => setMessageMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMessageMenuVisible(false)}
        >
          <View style={styles.menuContent}>
            <Pressable style={styles.menuItem} onPress={handleMenuReply}>
              <Ionicons name="arrow-undo-outline" size={20} color={colors.textPrimary} />
              <AppText style={styles.menuItemText}>Reply</AppText>
            </Pressable>
            {selectedMessage?.mine && (
              <>
                <View style={styles.menuDivider} />
                <Pressable style={styles.menuItem} onPress={handleDeleteMessage}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  <AppText style={[styles.menuItemText, { color: colors.danger }]}>Delete</AppText>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={Boolean(imagePreview)}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePreview(null)}
      >
        <View style={styles.imagePreviewOverlay}>
          <View style={styles.imagePreviewHeader}>
            <AppText color="#FFFFFF" numberOfLines={1} style={styles.imagePreviewTitle}>
              {imagePreview?.name || 'Image preview'}
            </AppText>

            <View style={styles.imagePreviewActions}>
              <Pressable
                style={styles.imagePreviewAction}
                onPress={() => void openAttachmentUrl(imagePreview?.uri)}
              >
                <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={styles.imagePreviewAction}
                onPress={() => setImagePreview(null)}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.imagePreviewBody}
            onPress={() => setImagePreview(null)}
          >
            {imagePreview?.uri ? (
              <ExpoImage
                source={{ uri: imagePreview.uri }}
                style={styles.imagePreviewFull}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={120}
              />
            ) : null}
          </Pressable>
        </View>
      </Modal>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        style={styles.messagesArea}
        contentContainerStyle={styles.messagesList}
        keyboardDismissMode={
          Platform.OS === 'ios' ? 'interactive' : 'on-drag'
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={16}
        maxToRenderPerBatch={12}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === 'android'}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={messagesRefetching || fetchingOlderMessages}
            onRefresh={() => {
              if (hasOlderMessages && !fetchingOlderMessages) {
                void fetchOlderMessages();
              } else {
                void refetchMessages();
              }
            }}
          />
        }
        renderItem={renderMessageItem}
        ListHeaderComponent={renderMessagesFooter}
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() => {
          if (!fetchingOlderMessages) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      <View
        style={[
          styles.composerWrap,
          { paddingBottom: composerBottomPadding },
        ]}
      >
        <Pressable style={styles.attachButton} onPress={pickAttachment}>
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>

        <View style={styles.composerInputWrap}>
          {replyingTo ? (
            <View style={styles.replyingComposerBar}>
              <View style={styles.replyingTextWrap}>
                <AppText variant="caption" color="#166534" numberOfLines={1}>
                  Replying to {replyingTo.mine ? 'yourself' : name}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.textSecondary}
                  numberOfLines={1}
                >
                  {replyComposerText}
                </AppText>
              </View>
              <Pressable onPress={() => setReplyingTo(null)}>
                <Ionicons
                  name="close"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          ) : null}

          {pendingAttachment ? (
            <View style={styles.pendingAttachmentBar}>
              <Ionicons
                name={
                  pendingAttachment.isImage
                    ? 'image-outline'
                    : 'document-outline'
                }
                size={15}
                color={colors.textSecondary}
              />
              <AppText
                variant="caption"
                color={colors.textSecondary}
                numberOfLines={1}
                style={styles.pendingAttachmentText}
              >
                {pendingAttachment.name}
              </AppText>
              <Pressable onPress={() => setPendingAttachment(null)}>
                <Ionicons
                  name="close"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composerInputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={
                pendingAttachment
                  ? 'Add a caption (optional)'
                  : 'Type a message'
              }
              placeholderTextColor={colors.textMuted}
              style={styles.composerInput}
              multiline
            />
            <Pressable style={styles.smallAction} onPress={pickAttachment}>
              <Ionicons
                name="camera-outline"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[
            styles.sendButton,
            sending && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={sending}
        >
          <Ionicons name="send" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    overflow: 'hidden',
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
    backgroundColor: '#F8F9FE',
  },
  messagesList: {
    padding: spacing.lg,
    gap: spacing.sm,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  paginationLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  mineRow: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  theirBubbleShadow: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  myBubbleShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  replyPreviewBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    paddingLeft: spacing.sm,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    paddingVertical: 4,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: 4,
  },
  fileName: {
    flex: 1,
    fontWeight: '500',
  },
  imageBubbleWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    width: 240,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 4,
  },
  imageBubble: {
    width: '100%',
    height: 240,
    backgroundColor: '#E2E8F0',
  },
  imagePreviewHint: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  metaRow: {
    marginTop: 2,
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 10,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  composerInputWrap: {
    flex: 1,
    minHeight: 44,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  composerInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  composerInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    maxHeight: 96,
    fontSize: 15,
  },
  smallAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  replyingComposerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryLight + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 8,
    gap: spacing.sm,
  },
  replyingTextWrap: {
    flex: 1,
  },
  pendingAttachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  pendingAttachmentText: {
    flex: 1,
    fontWeight: '500',
    fontSize: 13,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: '#000000D0',
  },
  imagePreviewHeader: {
    paddingTop: spacing.xl * 1.8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePreviewTitle: {
    flex: 1,
  },
  imagePreviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  imagePreviewAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF22',
  },
  imagePreviewBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  imagePreviewFull: {
    width: '100%',
    height: '100%',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 8,
  },
  swipeActionContainer: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionView: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  senderName: {
    marginBottom: 2,
    fontWeight: '600',
    fontSize: 11,
  },
  avatarContainer: {
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
});
