import AttachmentPopup, { type AttachmentActionType } from '@/src/components/chat/AttachmentPopup';
import { Ionicons } from '@expo/vector-icons';
import {
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  archiveChat,
  createBatchChat,
  createChat,
  createGroupChat,
  deleteChat,
  generatePresignedUploadUrl,
  getUploadedFileUrl,
  unarchiveChat,
  uploadFileToPresignedPost,
  type ActiveUser,
  type ApiChat,
  type ApiMessage,
  type ChatBatch,
  type ChatStudent,
  type PresignedUploadFile,
} from '@/src/api/chat.api';
import AppText from '@/src/components/common/AppText';
import { useChatWebSocket, type ChatWsEvent } from '@/src/hooks/useChatWebSocket';
import {
  incrementUnreadCountInCache,
  scheduleUnreadCountRefresh,
} from '@/src/lib/unreadCount';
import type { DashboardStackParamList } from '@/src/navigation/DashboardStack';
import {
  useInfiniteChatBatches,
  useInfiniteChatList,
  useInfiniteChatStudents,
  useInfiniteChatUsers,
} from '@/src/queries/chat.query';
import { useAuthStore } from '@/src/store/auth.store';
import { colors, spacing } from '@/src/theme';
import { getToken } from '@/src/utils/token';
import {
  useQueryClient,
} from '@tanstack/react-query';

type Nav = NativeStackNavigationProp<
  DashboardStackParamList,
  'MessagesList'
>;

type RecipientTab = 'users' | 'students' | 'batches';
type GroupTab = 'users' | 'students';

type ChatPreview = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
  muted?: boolean;
  avatarColor: string;
  profilePic?: string | null;
  participantId?: number;
  chatType: 'individual' | 'group' | 'batch';
  isArchived: boolean;
};

type PickerFile = {
  uri: string;
  name: string;
  mimeType: string;
};

type RecipientItem = ActiveUser | ChatStudent | ChatBatch;

const DELETED_MESSAGE_TEXT = 'This message was deleted';
const CHAT_ROW_ESTIMATED_HEIGHT = 79;

const isMessageDeleted = (msg?: ApiMessage | null) =>
  Boolean(msg?.deleted_at || msg?.is_deleted);

const getMessageSummary = (msg?: ApiMessage | null) => {
  if (!msg) return 'No messages yet';
  if (isMessageDeleted(msg)) return DELETED_MESSAGE_TEXT;

  const text = typeof msg.content === 'string' ? msg.content.trim() : '';
  if (text) return text;

  const messageType = msg.message_type || 'text';
  if (messageType === 'image') return 'Image';
  if (messageType === 'audio') return 'Voice message';
  if (messageType === 'file') {
    return typeof msg.file_name === 'string' ? msg.file_name : 'Attachment';
  }
  return 'No messages yet';
};

const formatChatTime = (rawValue?: string | null) => {
  if (!rawValue) return '';

  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const valueDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const dayDiff = Math.round((today.getTime() - valueDay.getTime()) / 86400000);

  if (dayDiff === 0) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  if (dayDiff === 1) return 'Yesterday';
  return date.toLocaleDateString();
};

const getAvatarColor = (chatType: 'individual' | 'group' | 'batch') => {
  if (chatType === 'group') return colors.chatGroupBg;
  if (chatType === 'batch') return colors.chatBatchBg;
  return colors.chatDirectBg;
};

const mapApiChatToPreview = (
  chat: ApiChat,
  currentUserId?: number | string | null
): ChatPreview => {
  const anyChat = chat as any;

  if (chat.chat_type === 'group') {
    return {
      id: chat.uid,
      name: chat.group_name || 'Group Chat',
      lastMessage: getMessageSummary(chat.last_message_preview || anyChat.last_message),
      time: formatChatTime(
        chat.last_message_preview?.created_at || anyChat.last_message?.created_at || chat.last_message_at || anyChat.created_at
      ),
      unread: chat.unread_count || 0,
      avatarColor: getAvatarColor('group'),
      chatType: 'group',
      profilePic: chat.group_icon || null,
      isArchived: Boolean(chat.is_archived || anyChat.archived),
    };
  }

  if (chat.chat_type === 'batch') {
    return {
      id: chat.uid,
      name: chat.batch_name || 'Batch Chat',
      lastMessage: getMessageSummary(chat.last_message_preview || anyChat.last_message),
      time: formatChatTime(
        chat.last_message_preview?.created_at || anyChat.last_message?.created_at || chat.last_message_at || anyChat.created_at
      ),
      unread: chat.unread_count || 0,
      avatarColor: getAvatarColor('batch'),
      chatType: 'batch',
      profilePic: null, // Batches don't usually have icons in this API
      isArchived: Boolean(chat.is_archived || anyChat.archived),
    };
  }

  let otherParticipant = anyChat.other_participant;

  if (!otherParticipant && anyChat.participants && currentUserId) {
    const found = anyChat.participants.find(
      (p: any) => String(p.id) !== String(currentUserId)
    );
    if (found) {
      otherParticipant = {
        id: found.id,
        full_name: found.full_name,
        name: found.full_name,
        email: found.email,
        profile_pic: found.profile_pic,
        is_active: false,
      };
    }
  }

  const participant = otherParticipant || {};
  return {
    id: chat.uid,
    name: participant.full_name || participant.name || 'Unknown',
    lastMessage: getMessageSummary(chat.last_message_preview || anyChat.last_message),
    time: formatChatTime(
      chat.last_message_preview?.created_at || anyChat.last_message?.created_at || chat.last_message_at || anyChat.created_at
    ),
    unread: chat.unread_count || 0,
    avatarColor: getAvatarColor('individual'),
    participantId: participant.id,
    chatType: 'individual',
    online: Boolean(participant.is_active),
    profilePic: participant.profile_pic || null,
    isArchived: Boolean(chat.is_archived || anyChat.archived),
  };
};

const areChatPreviewsEqual = (a: ChatPreview, b: ChatPreview) =>
  a.id === b.id &&
  a.name === b.name &&
  a.lastMessage === b.lastMessage &&
  a.time === b.time &&
  a.unread === b.unread &&
  a.online === b.online &&
  a.muted === b.muted &&
  a.avatarColor === b.avatarColor &&
  a.participantId === b.participantId &&
  a.chatType === b.chatType &&
  a.isArchived === b.isArchived;

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

function Avatar({
  label,
  color,
  online,
  uri,
  onPress,
}: {
  label: string;
  color: string;
  online?: boolean;
  uri?: string | null;
  onPress?: () => void;
}) {
  const initial = label?.trim()?.charAt(0)?.toUpperCase() || 'U';

  const content = (
    <View style={styles.avatarOuter}>
      <View style={[styles.avatar, { backgroundColor: color + '25' }]}>
        {uri ? (
          <ExpoImage
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <AppText variant="subtitle" color={colors.primary} style={{ fontWeight: '800' }}>
            {initial}
          </AppText>
        )}
      </View>
      {online ? <View style={styles.onlineDot} /> : null}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

type ProfilePreviewModalProps = {
  visible: boolean;
  chat: ChatPreview | null;
  onClose: () => void;
  onOpenChat: (chat: ChatPreview) => void;
};

const ProfilePreviewModal = memo(function ProfilePreviewModal({
  visible,
  chat,
  onClose,
  onOpenChat,
}: ProfilePreviewModalProps) {
  if (!chat) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.profilePreviewOverlay} onPress={onClose}>
        <Pressable style={styles.profilePreviewCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.profilePreviewHeader}>
            <AppText variant="subtitle" color={colors.surface} numberOfLines={1} style={{ fontWeight: '600' }}>
              {chat.name}
            </AppText>
          </View>

          <View style={styles.profilePreviewBody}>
            {chat.profilePic ? (
              <ExpoImage
                source={{ uri: chat.profilePic }}
                style={styles.profilePreviewImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.profilePreviewPlaceholder, { backgroundColor: chat.avatarColor + '40' }]}>
                <AppText variant="h1" color={colors.primary} style={{ fontSize: 80 }}>
                  {chat.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.profilePreviewFooter}>
            <Pressable
              style={styles.profilePreviewAction}
              onPress={() => {
                onClose();
                onOpenChat(chat);
              }}
            >
              <Ionicons name="chatbubble-outline" size={22} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.profilePreviewAction} onPress={() => Alert.alert('Coming Soon')}>
              <Ionicons name="call-outline" size={22} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.profilePreviewAction} onPress={() => Alert.alert('Coming Soon')}>
              <Ionicons name="videocam-outline" size={22} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.profilePreviewAction} onPress={() => Alert.alert('Coming Soon')}>
              <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

type ChatRowProps = {
  chat: ChatPreview;
  onOpenChat: (chat: ChatPreview) => void;
  onMenuPress: (chat: ChatPreview) => void;
  onAvatarPress: (chat: ChatPreview) => void;
};

const ChatRow = memo(function ChatRow({ chat, onOpenChat, onMenuPress, onAvatarPress }: ChatRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chatRow,
        pressed && styles.pressedRow,
        chat.unread > 0 && styles.chatRowActive
      ]}
      onPress={() => onOpenChat(chat)}
    >
      <Avatar
        label={chat.name}
        color={chat.avatarColor}
        online={chat.online}
        uri={chat.profilePic}
        onPress={() => onAvatarPress(chat)}
      />

      <View style={styles.chatMiddle}>
        <AppText variant="subtitle" numberOfLines={1} style={styles.chatName}>
          {chat.name}
        </AppText>
        <AppText
          color={chat.unread > 0 ? colors.textPrimary : colors.textSecondary}
          numberOfLines={1}
          style={[styles.lastMessage, chat.unread > 0 && { fontWeight: '600' }]}
          variant="caption"
        >
          {chat.lastMessage}
        </AppText>
      </View>

      <View style={styles.chatRight}>
        <AppText
          variant="caption"
          style={[
            styles.chatTime,
            chat.unread > 0 && { color: colors.primary }
          ]}
        >
          {chat.time}
        </AppText>

        {chat.unread > 0 ? (
          <View style={styles.unreadBadge}>
            <AppText variant="caption" style={styles.unreadText}>
              {chat.unread}
            </AppText>
          </View>
        ) : chat.muted ? (
          <Ionicons
            name="volume-mute-outline"
            size={14}
            color={colors.textMuted}
          />
        ) : null}

        <Pressable
          onPress={() => onMenuPress(chat)}
          style={({ pressed }) => [
            styles.menuButton,
            pressed && { opacity: 0.6 }
          ]}
          hitSlop={10}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}, (prev, next) =>
  prev.onOpenChat === next.onOpenChat &&
  prev.onMenuPress === next.onMenuPress &&
  prev.onAvatarPress === next.onAvatarPress &&
  areChatPreviewsEqual(prev.chat, next.chat)
);

export default function MessagesListScreen() {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const seenIncomingMessageUidsRef = useRef<Set<string>>(new Set());

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [token, setToken] = useState('');
  const [currentUserId, setCurrentUserId] =
    useState<string | number | null>(null);

  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);

  const [previewChat, setPreviewChat] = useState<ChatPreview | null>(null);
  const [showProfilePreview, setShowProfilePreview] = useState(false);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [recipientTab, setRecipientTab] = useState<RecipientTab>('users');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [debouncedRecipientSearch, setDebouncedRecipientSearch] = useState('');

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupIcon, setGroupIcon] = useState<PickerFile | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [groupTab, setGroupTab] = useState<GroupTab>('users');
  const [groupSearch, setGroupSearch] = useState('');
  const [debouncedGroupSearch, setDebouncedGroupSearch] = useState('');
  const [selectedGroupParticipants, setSelectedGroupParticipants] = useState<
    (ActiveUser | ChatStudent)[]
  >([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRecipientSearch(recipientSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [recipientSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGroupSearch(groupSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [groupSearch]);

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

  const {
    data: chatsData,
    isLoading: chatsLoading,
    isRefetching: chatsRefetching,
    isFetchingNextPage: chatsFetchingNextPage,
    hasNextPage: chatsHasNextPage,
    fetchNextPage: fetchMoreChats,
    refetch: refetchChats,
    error: chatsError,
  } = useInfiniteChatList({
    search: debouncedSearch || undefined,
    pageSize: 30,
    archivedOnly: showArchivedOnly,
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    isFetchingNextPage: usersFetchingNextPage,
    hasNextPage: usersHasNextPage,
    fetchNextPage: fetchMoreUsers,
  } = useInfiniteChatUsers({
    search: recipientTab === 'users' ? debouncedRecipientSearch : '',
    pageSize: 30,
    enabled: showNewChatModal && recipientTab === 'users',
  });

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isFetchingNextPage: studentsFetchingNextPage,
    hasNextPage: studentsHasNextPage,
    fetchNextPage: fetchMoreStudents,
  } = useInfiniteChatStudents({
    search: recipientTab === 'students' ? debouncedRecipientSearch : '',
    pageSize: 30,
    enabled: showNewChatModal && recipientTab === 'students',
  });

  const {
    data: batchesData,
    isLoading: batchesLoading,
    isFetchingNextPage: batchesFetchingNextPage,
    hasNextPage: batchesHasNextPage,
    fetchNextPage: fetchMoreBatches,
  } = useInfiniteChatBatches({
    search: recipientTab === 'batches' ? debouncedRecipientSearch : '',
    pageSize: 30,
    enabled: showNewChatModal && recipientTab === 'batches',
  });

  const {
    data: groupUsersData,
    isLoading: groupUsersLoading,
    isFetchingNextPage: groupUsersFetchingNextPage,
    hasNextPage: groupUsersHasNextPage,
    fetchNextPage: fetchMoreGroupUsers,
  } = useInfiniteChatUsers({
    search: groupTab === 'users' ? debouncedGroupSearch : '',
    pageSize: 15,
    enabled: showCreateGroupModal && groupTab === 'users',
  });

  const {
    data: groupStudentsData,
    isLoading: groupStudentsLoading,
    isFetchingNextPage: groupStudentsFetchingNextPage,
    hasNextPage: groupStudentsHasNextPage,
    fetchNextPage: fetchMoreGroupStudents,
  } = useInfiniteChatStudents({
    search: groupTab === 'students' ? debouncedGroupSearch : '',
    pageSize: 15,
    enabled: showCreateGroupModal && groupTab === 'students',
  });

  const chatLoadError = useMemo(() => {
    const err = chatsError as any;
    if (!err) return null;
    return (
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      'Failed to load chats'
    );
  }, [chatsError]);

  const mappedChatsFromQuery = useMemo(() => {
    const seen = new Set<string>();
    return (
      chatsData?.pages.flatMap((page) =>
        (page.results || [])
          .filter((chat) => {
            if (!chat?.uid || seen.has(chat.uid)) return false;
            seen.add(chat.uid);
            return true;
          })
          .map((chat) => mapApiChatToPreview(chat, currentUserId))
      ) || []
    );
  }, [chatsData, currentUserId]);

  useEffect(() => {
    if (isFocused) {
      void refetchChats();
      scheduleUnreadCountRefresh(queryClient);
    }
  }, [isFocused, queryClient, refetchChats]);

  useEffect(() => {
    // Clear local state when mode or search changes to prevent cross-contamination of cached data
    setChats([]);
  }, [showArchivedOnly, debouncedSearch]);

  useEffect(() => {
    if (mappedChatsFromQuery.length === 0) {
      if (!chatsLoading && !chatsRefetching) {
        // If query returned nothing, we should respect that for the current mode
        // but maybe we don't want to clear EVERYTHING if we had some local updates.
        // However, for mode switching, we already clear it above.
      }
      return;
    }

    setChats((prev) => {
      const prevById = new Map(prev.map((chat) => [chat.id, chat]));
      const mappedWithStableRefs = mappedChatsFromQuery.map((chat) => {
        const existing = prevById.get(chat.id);
        if (!existing) return chat;
        return areChatPreviewsEqual(existing, chat) ? existing : chat;
      });

      const mappedIds = new Set(mappedWithStableRefs.map((chat) => chat.id));
      const localOnly = prev.filter((chat) => !mappedIds.has(chat.id));
      return [...localOnly, ...mappedWithStableRefs];
    });
  }, [mappedChatsFromQuery]);

  const filteredChats = useMemo(() => {
    const s = search.trim().toLowerCase();
    const base = chats.filter(chat => chat.isArchived === showArchivedOnly);
    if (!s) return base;
    return base.filter(
      (chat) =>
        chat.name.toLowerCase().includes(s) ||
        chat.lastMessage.toLowerCase().includes(s)
    );
  }, [chats, search, showArchivedOnly]);

  const getParticipantId = (item: ActiveUser | ChatStudent) => {
    if (typeof item.user_id === 'number') return item.user_id;
    if (typeof item.id === 'number') return item.id;
    return null;
  };

  const getRecipientName = (item: RecipientItem): string => {
    if ('batch_name' in item) {
      if (typeof item.batch_name === 'string' && item.batch_name) {
        return item.batch_name;
      }
      if (typeof item.name === 'string' && item.name) {
        return item.name;
      }
      return 'Batch';
    }

    if ('full_name' in item && typeof item.full_name === 'string' && item.full_name) {
      return item.full_name;
    }
    if (typeof item.name === 'string' && item.name) {
      return item.name;
    }
    if (typeof item.email === 'string' && item.email) {
      return item.email;
    }
    return 'Unknown';
  };

  const getRecipientSubtitle = (
    item: RecipientItem,
    tab: RecipientTab
  ): string => {
    if (tab === 'batches') {
      return 'Batch chat';
    }

    if (typeof item.email === 'string' && item.email) {
      return item.email;
    }
    if (typeof item.phone === 'string' && item.phone) {
      return item.phone;
    }
    if ('student_id' in item && typeof item.student_id === 'string' && item.student_id) {
      return item.student_id;
    }
    return '';
  };

  const upsertChatToTop = useCallback((nextChat: ChatPreview) => {
    setChats((prev) => {
      const remaining = prev.filter((chat) => chat.id !== nextChat.id);
      return [nextChat, ...remaining];
    });
  }, []);

  const navigateToChat = useCallback(
    (chat: ChatPreview) => {
      // 🚀 Instant Update: Zero out unread count locally
      setChats((prev) =>
        prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c))
      );

      navigation.navigate('ChatThread', {
        chatId: chat.id,
        name: chat.name,
        avatarColor: chat.avatarColor,
        profilePic: chat.profilePic,
        online: chat.online,
        participantId: chat.participantId,
        chatType: chat.chatType,
      });
    },
    [navigation]
  );

  const openExistingOrCreatedChat = useCallback(
    (apiChat: ApiChat) => {
      const preview = mapApiChatToPreview(apiChat, currentUserId);
      upsertChatToTop(preview);
      setShowNewChatModal(false);
      navigateToChat(preview);
    },
    [navigateToChat, upsertChatToTop, currentUserId]
  );

  const handleOpenRecipientChat = useCallback(
    async (item: ActiveUser | ChatStudent | ChatBatch, tab: RecipientTab) => {
      try {
        setIsCreatingChat(true);
        if (tab === 'batches') {
          const batchUid = item.uid;
          if (!batchUid) return;
          const response = await createBatchChat(batchUid);
          if (response?.status === 'success' && response.chat) {
            openExistingOrCreatedChat(response.chat as ApiChat);
          }
          return;
        }

        const userId = getParticipantId(item as ActiveUser | ChatStudent);
        if (!userId) return;

        const response = await createChat({ user_id: userId });
        if (response?.status === 'success' && response.chat) {
          openExistingOrCreatedChat(response.chat as ApiChat);
        }
      } catch (error: any) {
        const errorData = error?.response?.data;
        console.log('❌ Create Chat Error:', errorData);

        const errorDetail = errorData?.detail;
        const errorMessage = errorData?.error || errorData?.message;
        const fallbackMessage = 'Failed to create chat. Please try again.';

        const displayMessage = errorDetail || errorMessage || fallbackMessage;

        Alert.alert('Error', displayMessage);
      } finally {
        setIsCreatingChat(false);
      }
    },
    [openExistingOrCreatedChat]
  );

  const toggleGroupParticipant = useCallback(
    (participant: ActiveUser | ChatStudent) => {
      const participantId = getParticipantId(participant);
      if (!participantId) return;

      setSelectedGroupParticipants((prev) => {
        const exists = prev.some(
          (item) => getParticipantId(item) === participantId
        );
        if (exists) {
          return prev.filter(
            (item) => getParticipantId(item) !== participantId
          );
        }
        return [...prev, participant];
      });
    },
    []
  );

  const handleIconPickerSelect = useCallback(async (type: AttachmentActionType) => {
    try {
      if (type === 'gallery') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Gallery permission is required to choose a group icon.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]) {
          const file = result.assets[0];
          setGroupIcon({
            uri: file.uri,
            name: file.fileName || file.uri.split('/').pop() || 'group-icon.jpg',
            mimeType: file.mimeType || 'image/jpeg',
          });
        }
      } else if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take a group icon.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]) {
          const file = result.assets[0];
          setGroupIcon({
            uri: file.uri,
            name: file.fileName || file.uri.split('/').pop() || 'group-icon-camera.jpg',
            mimeType: file.mimeType || 'image/jpeg',
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const openGroupIconPicker = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            void handleIconPickerSelect('camera');
          } else if (buttonIndex === 2) {
            void handleIconPickerSelect('gallery');
          }
        }
      );
      return;
    }

    setShowIconPicker(true);
  }, [handleIconPickerSelect]);

  const resetGroupModal = useCallback(() => {
    setGroupName('');
    setGroupDescription('');
    setGroupIcon(null);
    setGroupSearch('');
    setGroupTab('users');
    setSelectedGroupParticipants([]);
    setShowIconPicker(false);
  }, []);

  const handleCreateGroup = useCallback(async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName || creatingGroup) return;

    const participantIds = selectedGroupParticipants
      .map((participant) => getParticipantId(participant))
      .filter((id): id is number => typeof id === 'number');

    if (!participantIds.length) return;

    try {
      setCreatingGroup(true);

      let iconUrl = '';
      if (groupIcon) {
        const presigned = await generatePresignedUploadUrl({
          file_name: groupIcon.name,
          folder: 'group-icons',
        });

        if (presigned?.success) {
          const uploadFile: PresignedUploadFile = {
            uri: groupIcon.uri,
            name: groupIcon.name,
            type: groupIcon.mimeType,
          };
          await uploadFileToPresignedPost(presigned, uploadFile);
          iconUrl = getUploadedFileUrl(presigned) || '';
        }
      }

      const payload: Record<string, unknown> = {
        group_name: trimmedName,
        group_description: groupDescription.trim(),
        participant_ids: participantIds,
      };
      if (iconUrl) {
        payload.group_icon = iconUrl;
      }

      await createGroupChat(payload);
      setShowCreateGroupModal(false);
      resetGroupModal();
      await refetchChats();
    } catch {
      // silent fail for now
    } finally {
      setCreatingGroup(false);
    }
  }, [
    creatingGroup,
    groupDescription,
    groupIcon,
    groupName,
    refetchChats,
    resetGroupModal,
    selectedGroupParticipants,
  ]);

  const handleWsMessage = useCallback(
    (event: ChatWsEvent) => {
      if (event.type === 'presence' && event.user) {
        const userData =
          typeof event.user === 'object' && event.user
            ? (event.user as Record<string, unknown>)
            : null;
        const userId =
          userData && typeof userData.id === 'number'
            ? userData.id
            : null;
        if (!userId) return;

        const isOnline = Boolean(event.online);
        setChats((prev) =>
          prev.map((chat) =>
            chat.chatType === 'individual' &&
              chat.participantId === userId
              ? { ...chat, online: isOnline }
              : chat
          )
        );
        return;
      }

      if (event.type !== 'new_message' && event.type !== 'queued_message') {
        return;
      }

      const rawMessage =
        event.type === 'queued_message' && event.message
          ? (event.message as ApiMessage)
          : (event as ApiMessage);

      const chatUid =
        (rawMessage.chat_uid as string | undefined) ||
        (rawMessage.chat as string | undefined) ||
        '';

      if (!chatUid) return;

      const sender =
        rawMessage.sender && typeof rawMessage.sender === 'object'
          ? rawMessage.sender
          : {};

      const fromMe =
        (Boolean(user?.uid) && sender.uid === user?.uid) ||
        (currentUserId !== null &&
          sender.id !== undefined &&
          String(sender.id) === String(currentUserId));

      const summary = getMessageSummary(rawMessage);
      const nextTime = formatChatTime(rawMessage.created_at);
      const messageUid = typeof rawMessage.uid === 'string' ? rawMessage.uid : '';
      const alreadyProcessed =
        !fromMe &&
        Boolean(messageUid) &&
        seenIncomingMessageUidsRef.current.has(messageUid);
      const shouldIncrementUnread = !fromMe && !alreadyProcessed;

      if (shouldIncrementUnread && messageUid) {
        seenIncomingMessageUidsRef.current.add(messageUid);
        if (seenIncomingMessageUidsRef.current.size > 600) {
          seenIncomingMessageUidsRef.current.clear();
          seenIncomingMessageUidsRef.current.add(messageUid);
        }
      }

      setChats((prev) => {
        const index = prev.findIndex((chat) => chat.id === chatUid);
        if (index === -1) {
          const fallback: ChatPreview = {
            id: chatUid,
            name:
              sender.full_name || sender.name || 'New chat',
            lastMessage: summary,
            time: nextTime,
            unread: shouldIncrementUnread ? 1 : 0,
            avatarColor: getAvatarColor('individual'),
            participantId: sender.id,
            chatType: 'individual',
            online: Boolean(sender.is_active),
            isArchived: false,
          };
          return [fallback, ...prev];
        }

        const current = prev[index];
        const updated: ChatPreview = {
          ...current,
          lastMessage: summary,
          time: nextTime || current.time,
          unread: shouldIncrementUnread ? current.unread + 1 : current.unread,
        };

        return [updated, ...prev.slice(0, index), ...prev.slice(index + 1)];
      });

      if (shouldIncrementUnread) {
        incrementUnreadCountInCache(queryClient, 1);
        scheduleUnreadCountRefresh(queryClient);
      }
    },
    [currentUserId, queryClient, user?.uid]
  );

  useChatWebSocket({
    token,
    enabled: Boolean(token) && isFocused,
    onMessage: handleWsMessage,
  });

  const usersList = useMemo(() => {
    return usersData?.pages.flatMap((page: any) => {
      return page.users || page.results || page.data?.users || page.data?.results || [];
    }) || [];
  }, [usersData]);

  const studentsList = useMemo(() => {
    return studentsData?.pages.flatMap((page: any) => {
      return page.results || page.students || page.data?.students || page.data?.results || [];
    }) || [];
  }, [studentsData]);

  const batchesList = useMemo(() => {
    return batchesData?.pages.flatMap((page: any) => {
      return page.results || page.batches || page.data?.batches || page.data?.results || [];
    }) || [];
  }, [batchesData]);

  const groupCandidates = useMemo<(ActiveUser | ChatStudent)[]>(
    () =>
      groupTab === 'users'
        ? groupUsersData?.pages.flatMap((page: any) => page.users || page.results || page.data?.users || []) || []
        : groupStudentsData?.pages.flatMap(
          (page: any) => page.students || page.results || page.data?.students || []) || [],
    [groupStudentsData, groupTab, groupUsersData]
  );

  const activeRecipients = useMemo<RecipientItem[]>(() => {
    if (recipientTab === 'users') return usersList;
    if (recipientTab === 'students') return studentsList;
    return batchesList;
  }, [batchesList, recipientTab, studentsList, usersList]);

  const recipientLoading =
    (recipientTab === 'users' && usersLoading) ||
    (recipientTab === 'students' && studentsLoading) ||
    (recipientTab === 'batches' && batchesLoading);

  const recipientFetchingNextPage =
    (recipientTab === 'users' && usersFetchingNextPage) ||
    (recipientTab === 'students' && studentsFetchingNextPage) ||
    (recipientTab === 'batches' && batchesFetchingNextPage);

  const groupCandidatesLoading =
    (groupTab === 'users' && groupUsersLoading) ||
    (groupTab === 'students' && groupStudentsLoading);

  const groupCandidatesFetchingNextPage =
    (groupTab === 'users' && groupUsersFetchingNextPage) ||
    (groupTab === 'students' && groupStudentsFetchingNextPage);

  const groupParticipantIds = useMemo(
    () =>
      new Set(
        selectedGroupParticipants
          .map((participant) => getParticipantId(participant))
          .filter((id): id is number => typeof id === 'number')
      ),
    [selectedGroupParticipants]
  );

  const handleOpenChat = useCallback((chat: ChatPreview) => {
    navigateToChat(chat);
  }, [navigateToChat]);

  const handleMenuPress = useCallback((chat: ChatPreview) => {
    setSelectedChat(chat);
    setShowChatMenu(true);
  }, []);

  const handleArchiveChat = useCallback(async () => {
    if (!selectedChat) return;
    try {
      await archiveChat(selectedChat.id);
      setChats((prev) =>
        prev.map((c) => c.id === selectedChat.id ? { ...c, isArchived: true } : c)
      );
      queryClient.invalidateQueries({ queryKey: ['chat-list'] });
      setShowChatMenu(false);
      setSelectedChat(null);
    } catch {
      Alert.alert('Error', 'Failed to archive chat');
    }
  }, [selectedChat, queryClient]);

  const handleUnarchiveChat = useCallback(async () => {
    if (!selectedChat) return;
    try {
      await unarchiveChat(selectedChat.id);
      setChats((prev) =>
        prev.map((c) => c.id === selectedChat.id ? { ...c, isArchived: false } : c)
      );
      queryClient.invalidateQueries({ queryKey: ['chat-list'] });
      setShowChatMenu(false);
      setSelectedChat(null);
    } catch {
      Alert.alert('Error', 'Failed to unarchive chat');
    }
  }, [selectedChat, queryClient]);

  const handleDeleteChat = useCallback(() => {
    if (!selectedChat) return;

    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChat(selectedChat.id);
              setChats((prev) => prev.filter((c) => c.id !== selectedChat.id));
              queryClient.invalidateQueries({ queryKey: ['chat-list'] });
              setShowChatMenu(false);
              setSelectedChat(null);
            } catch {
              Alert.alert('Error', 'Failed to delete chat');
            }
          },
        },
      ]
    );
  }, [selectedChat, queryClient]);

  const chatKeyExtractor = useCallback((item: ChatPreview) => item.id, []);
  const getChatItemLayout = useCallback(
    (_: ArrayLike<ChatPreview> | null | undefined, index: number) => ({
      length: CHAT_ROW_ESTIMATED_HEIGHT,
      offset: CHAT_ROW_ESTIMATED_HEIGHT * index,
      index,
    }),
    []
  );

  const renderChatItem = useCallback(
    ({ item }: { item: ChatPreview }) => (
      <ChatRow
        chat={item}
        onOpenChat={handleOpenChat}
        onMenuPress={handleMenuPress}
        onAvatarPress={(chat) => {
          setPreviewChat(chat);
          setShowProfilePreview(true);
        }}
      />
    ),
    [handleOpenChat, handleMenuPress]
  );

  const refreshChats = useCallback(async () => {
    try {
      setIsManualRefreshing(true);
      await refetchChats();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetchChats]);

  const loadMoreChats = useCallback(() => {
    if (!chatsHasNextPage || chatsFetchingNextPage) return;
    void fetchMoreChats();
  }, [chatsFetchingNextPage, chatsHasNextPage, fetchMoreChats]);

  const loadMoreRecipients = useCallback(() => {
    if (recipientTab === 'users') {
      if (!usersHasNextPage || usersFetchingNextPage) return;
      void fetchMoreUsers();
      return;
    }

    if (recipientTab === 'students') {
      if (!studentsHasNextPage || studentsFetchingNextPage) return;
      void fetchMoreStudents();
      return;
    }

    if (!batchesHasNextPage || batchesFetchingNextPage) return;
    void fetchMoreBatches();
  }, [
    batchesFetchingNextPage,
    batchesHasNextPage,
    fetchMoreBatches,
    fetchMoreStudents,
    fetchMoreUsers,
    recipientTab,
    studentsFetchingNextPage,
    studentsHasNextPage,
    usersFetchingNextPage,
    usersHasNextPage,
  ]);

  const loadMoreGroupCandidates = useCallback(() => {
    if (groupTab === 'users') {
      if (!groupUsersHasNextPage || groupUsersFetchingNextPage) return;
      void fetchMoreGroupUsers();
      return;
    }

    if (!groupStudentsHasNextPage || groupStudentsFetchingNextPage) return;
    void fetchMoreGroupStudents();
  }, [
    fetchMoreGroupStudents,
    fetchMoreGroupUsers,
    groupStudentsFetchingNextPage,
    groupStudentsHasNextPage,
    groupTab,
    groupUsersFetchingNextPage,
    groupUsersHasNextPage,
  ]);

  const renderChatsEmpty = useCallback(() => (
    <View style={styles.emptyState}>
      {chatsLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <AppText color={colors.textSecondary}>
            {chatLoadError ? chatLoadError : 'No chats found'}
          </AppText>
          {chatLoadError ? (
            <Pressable
              style={styles.retryBtn}
              onPress={() => void refetchChats()}
            >
              <AppText color={colors.primary}>
                Retry
              </AppText>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  ), [chatLoadError, chatsLoading, refetchChats]);

  const renderChatRow = useCallback(
    ({ item }: { item: ChatPreview }) => (
      <ChatRow
        chat={item}
        onOpenChat={navigateToChat}
        onMenuPress={handleMenuPress}
        onAvatarPress={(chat) => {
          setPreviewChat(chat);
          setShowProfilePreview(true);
        }}
      />
    ),
    [navigateToChat, handleMenuPress]
  );

  const keyExtractor = useCallback((item: ChatPreview) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Ionicons
            name="search"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search chats"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => {
              setRecipientSearch('');
              setRecipientTab('users');
              setShowNewChatModal(true);
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.tealStrong} />
            <AppText variant="caption" color={colors.tealStrong}>
              New Chat
            </AppText>
          </Pressable>

          <Pressable
            style={styles.quickActionBtn}
            onPress={() => {
              setShowCreateGroupModal(true);
              setGroupSearch('');
              setGroupTab('users');
            }}
          >
            <Ionicons name="people-outline" size={16} color={colors.blueStrong} />
            <AppText variant="caption" color={colors.blueStrong}>
              Create Group
            </AppText>
          </Pressable>

          <Pressable
            style={[styles.quickActionBtn, showArchivedOnly && styles.quickActionBtnActive]}
            onPress={() => setShowArchivedOnly(!showArchivedOnly)}
          >
            <Ionicons
              name={showArchivedOnly ? "archive" : "archive-outline"}
              size={16}
              color={showArchivedOnly ? colors.primary : colors.textSecondary}
            />
            <AppText variant="caption" color={showArchivedOnly ? colors.primary : colors.textSecondary}>
              {showArchivedOnly ? 'All Chats' : 'Archived'}
            </AppText>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showChatMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChatMenu(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setShowChatMenu(false)}
        >
          <View style={styles.menuContent}>
            {selectedChat?.isArchived ? (
              <Pressable style={styles.menuItem} onPress={handleUnarchiveChat}>
                <Ionicons name="chatbox-outline" size={20} color={colors.textPrimary} />
                <AppText style={styles.menuItemText}>Unarchive</AppText>
              </Pressable>
            ) : (
              <Pressable style={styles.menuItem} onPress={handleArchiveChat}>
                <Ionicons name="archive-outline" size={20} color={colors.textPrimary} />
                <AppText style={styles.menuItemText}>Archive</AppText>
              </Pressable>
            )}
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={handleDeleteChat}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <AppText style={[styles.menuItemText, { color: colors.danger }]}>Delete</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ProfilePreviewModal
        visible={showProfilePreview}
        chat={previewChat}
        onClose={() => setShowProfilePreview(false)}
        onOpenChat={navigateToChat}
      />

      <FlatList
        data={filteredChats}
        keyExtractor={chatKeyExtractor}
        contentContainerStyle={styles.list}
        initialNumToRender={14}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={refreshChats}
          />
        }
        onEndReached={loadMoreChats}
        onEndReachedThreshold={0.35}
        renderItem={renderChatItem}
        ListFooterComponent={
          chatsFetchingNextPage ? (
            <View style={styles.modalLoaderWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={renderChatsEmpty}
      />

      <Modal
        visible={showNewChatModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {isCreatingChat && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: 16 }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <AppText style={{ marginTop: 8, color: colors.primary, fontWeight: '600' }}>Creating chat...</AppText>
                </View>
              )}
              <View style={styles.modalHeaderRow}>
                <AppText variant="subtitle">Start Conversation</AppText>
                <Pressable onPress={() => setShowNewChatModal(false)}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.tabsRow}>
                {(['users', 'students', 'batches'] as RecipientTab[]).map((tab) => (
                  <Pressable
                    key={tab}
                    style={[
                      styles.tabBtn,
                      recipientTab === tab && styles.tabBtnActive,
                    ]}
                    onPress={() => {
                      setRecipientTab(tab);
                      setRecipientSearch('');
                    }}
                  >
                    <AppText
                      variant="caption"
                      color={recipientTab === tab ? colors.surface : colors.textSecondary}
                    >
                      {tab === 'users'
                        ? 'Users'
                        : tab === 'students'
                          ? 'Students'
                          : 'Batches'}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalSearchRow}>
                <Ionicons name="search" size={16} color={colors.textSecondary} />
                <TextInput
                  value={recipientSearch}
                  onChangeText={setRecipientSearch}
                  placeholder={`Search ${recipientTab === 'users'
                    ? 'users'
                    : recipientTab === 'students'
                      ? 'students'
                      : 'batches'
                    }`}
                  placeholderTextColor={colors.textMuted}
                  style={styles.modalSearchInput}
                />
              </View>

              {recipientLoading ? (
                <View style={styles.modalLoaderWrap}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={activeRecipients}
                  keyExtractor={(item: RecipientItem, idx: number) =>
                    String(item.uid || item.user_id || item.id || idx)
                  }
                  style={styles.modalListView}
                  contentContainerStyle={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                  onEndReached={loadMoreRecipients}
                  onEndReachedThreshold={0.35}
                  renderItem={({ item }: { item: RecipientItem }) => (
                    <Pressable
                      style={styles.modalListRow}
                      onPress={() =>
                        void handleOpenRecipientChat(item, recipientTab)
                      }
                    >
                      <View style={styles.modalListAvatar}>
                        <AppText variant="caption" color={colors.textPrimary}>
                          {getRecipientName(item).charAt(0).toUpperCase()}
                        </AppText>
                      </View>
                      <View style={styles.modalListTextWrap}>
                        <AppText variant="subtitle" numberOfLines={1}>
                          {getRecipientName(item)}
                        </AppText>
                        <AppText
                          variant="caption"
                          color={colors.textSecondary}
                          numberOfLines={1}
                        >
                          {getRecipientSubtitle(item, recipientTab)}
                        </AppText>
                      </View>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <View style={styles.modalEmptyWrap}>
                      <AppText color={colors.textSecondary}>No results</AppText>
                    </View>
                  }
                  ListFooterComponent={
                    recipientFetchingNextPage ? (
                      <View style={styles.modalLoaderWrap}>
                        <ActivityIndicator color={colors.primary} />
                      </View>
                    ) : null
                  }
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowCreateGroupModal(false);
          resetGroupModal();
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardTall}>
              <View style={styles.modalHeaderRow}>
                <AppText variant="subtitle">Create Group</AppText>
                <Pressable
                  onPress={() => {
                    setShowCreateGroupModal(false);
                    resetGroupModal();
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Group name"
                placeholderTextColor={colors.textMuted}
                style={styles.groupInput}
              />
              <TextInput
                value={groupDescription}
                onChangeText={setGroupDescription}
                placeholder="Group description"
                placeholderTextColor={colors.textMuted}
                style={styles.groupInput}
              />

              <Pressable style={styles.iconPickerBtn} onPress={openGroupIconPicker}>
                {groupIcon ? (
                  <>
                    <ExpoImage
                      source={{ uri: groupIcon.uri }}
                      style={styles.groupIconPreview}
                      contentFit="cover"
                    />
                    <View style={styles.groupIconActionRow}>
                      <AppText variant="caption" color={colors.primary}>
                        Change Icon
                      </AppText>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setGroupIcon(null);
                        }}
                        hitSlop={10}
                        style={{ marginLeft: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.iconPlaceholder}>
                      <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
                    </View>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Add group icon (optional)
                    </AppText>
                  </>
                )}
              </Pressable>

              <View style={styles.tabsRow}>
                {(['users', 'students'] as GroupTab[]).map((tab) => (
                  <Pressable
                    key={tab}
                    style={[
                      styles.tabBtn,
                      groupTab === tab && styles.tabBtnActive,
                    ]}
                    onPress={() => {
                      setGroupTab(tab);
                      setGroupSearch('');
                    }}
                  >
                    <AppText
                      variant="caption"
                      color={groupTab === tab ? colors.surface : colors.textSecondary}
                    >
                      {tab === 'users' ? 'Users' : 'Students'}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalSearchRow}>
                <Ionicons name="search" size={16} color={colors.textSecondary} />
                <TextInput
                  value={groupSearch}
                  onChangeText={setGroupSearch}
                  placeholder={`Search ${groupTab}`}
                  placeholderTextColor={colors.textMuted}
                  style={styles.modalSearchInput}
                />
              </View>

              <AppText variant="caption" color={colors.textSecondary}>
                Selected: {selectedGroupParticipants.length}
              </AppText>

              {groupCandidatesLoading ? (
                <View style={styles.modalLoaderWrap}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={groupCandidates}
                  keyExtractor={(item: ActiveUser | ChatStudent, idx: number) =>
                    String(item.uid || item.user_id || item.id || idx)
                  }
                  style={styles.modalListView}
                  contentContainerStyle={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                  onEndReached={loadMoreGroupCandidates}
                  onEndReachedThreshold={0.35}
                  renderItem={({ item }: { item: ActiveUser | ChatStudent }) => {
                    const participantId = getParticipantId(item);
                    const selected =
                      typeof participantId === 'number' &&
                      groupParticipantIds.has(participantId);

                    return (
                      <Pressable
                        style={styles.modalListRow}
                        onPress={() => toggleGroupParticipant(item)}
                      >
                        <View style={styles.modalListAvatar}>
                          <AppText variant="caption" color={colors.textPrimary}>
                            {getRecipientName(item).charAt(0).toUpperCase()}
                          </AppText>
                        </View>
                        <View style={styles.modalListTextWrap}>
                          <AppText variant="subtitle" numberOfLines={1}>
                            {getRecipientName(item)}
                          </AppText>
                          <AppText
                            variant="caption"
                            color={colors.textSecondary}
                            numberOfLines={1}
                          >
                            {getRecipientSubtitle(item, groupTab)}
                          </AppText>
                        </View>
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={selected ? colors.successStrong : colors.textMuted}
                        />
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.modalEmptyWrap}>
                      <AppText color={colors.textSecondary}>No participants</AppText>
                    </View>
                  }
                  ListFooterComponent={
                    groupCandidatesFetchingNextPage ? (
                      <View style={styles.modalLoaderWrap}>
                        <ActivityIndicator color={colors.primary} />
                      </View>
                    ) : null
                  }
                />
              )}

              <Pressable
                style={[
                  styles.createGroupBtn,
                  (!groupName.trim() || !selectedGroupParticipants.length || creatingGroup) &&
                  styles.createGroupBtnDisabled,
                ]}
                onPress={() => void handleCreateGroup()}
                disabled={
                  !groupName.trim() ||
                  !selectedGroupParticipants.length ||
                  creatingGroup
                }
              >
                <AppText variant="subtitle" color={colors.surface}>
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </AppText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AttachmentPopup
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={handleIconPickerSelect}
        options={['camera', 'gallery']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  quickActionBtnActive: {
    backgroundColor: colors.primaryLight + '20',
    borderColor: colors.primary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  chatRowActive: {
    backgroundColor: colors.primaryLight + '10',
    borderColor: colors.primaryLight + '30',
  },
  avatarOuter: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: colors.surface,
    backgroundColor: colors.success,
  },
  chatMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontWeight: '800',
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chatRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  chatTime: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadText: {
    fontSize: 10,
    color: colors.surface,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: spacing.sm,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    minHeight: 420,
    height: '82%',
    maxHeight: '85%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalCardTall: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    minHeight: 500,
    height: '90%',
    maxHeight: '92%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.surfaceSubtle,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSearchInput: {
    flex: 1,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontWeight: '500',
  },
  modalLoaderWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  modalList: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  modalListView: {
    flex: 1,
  },
  modalListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
    gap: spacing.md,
  },
  modalListAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight + '20',
    overflow: 'hidden',
  },
  modalListTextWrap: {
    flex: 1,
  },
  modalEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  groupInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  iconPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupIconPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  groupIconActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createGroupBtn: {
    marginTop: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createGroupBtnDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  pressedRow: {
    opacity: 0.7,
  },
  menuButton: {
    padding: 4,
    marginLeft: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: colors.black,
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
    backgroundColor: colors.surfaceSubtle,
    marginHorizontal: 8,
  },
  profilePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePreviewCard: {
    width: 260,
    backgroundColor: colors.surface,
    borderRadius: 0, // WhatsApp uses a square look but let's give it a tiny radius if needed
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  profilePreviewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  profilePreviewBody: {
    width: 260,
    height: 260,
    backgroundColor: colors.border,
  },
  profilePreviewImage: {
    width: '100%',
    height: '100%',
  },
  profilePreviewPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePreviewFooter: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.surface,
  },
  profilePreviewAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
