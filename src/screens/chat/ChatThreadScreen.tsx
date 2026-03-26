import { Ionicons } from '@expo/vector-icons';
import {
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { AudioModule, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, type AudioRecorder } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
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
import AttachmentPopup, { AttachmentActionType } from '@/src/components/chat/AttachmentPopup';
import AudioPlayer from '@/src/components/chat/AudioPlayer';
import ForwardMessageModal from '@/src/components/chat/ForwardMessageModal';
import MessageReadInfoModal from '@/src/components/chat/MessageReadInfoModal';
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
  clientId?: string;
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
  messageId?: string;
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
const DOWNLOAD_DIR_URI_KEY = 'chat_download_directory_uri_v1';
const APP_DOWNLOADS_FOLDER_NAME = 'CRM Mobile Downloads';
const MAX_FILE_NAME_LENGTH = 30;

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

const isFileLikeMessageType = (messageType?: string | null) => {
  if (!messageType) return false;
  const normalized = messageType.trim().toLowerCase();
  return normalized === 'file' || normalized === 'document';
};

const getDisplayFileName = (message: ThreadMessage) => {
  const rawFileName = (message.fileName || '').trim();
  if (rawFileName) return rawFileName;

  const fallbackText = (message.text || '').trim();
  const normalizedFallback = fallbackText.toLowerCase();
  if (
    fallbackText &&
    normalizedFallback !== 'file attachment' &&
    normalizedFallback !== 'attachment' &&
    normalizedFallback !== DELETED_MESSAGE_TEXT.toLowerCase()
  ) {
    return fallbackText;
  }

  return 'Attachment';
};

const truncateFileName = (name: string, maxLength = MAX_FILE_NAME_LENGTH) => {
  if (name.length <= maxLength) return name;

  const lastDotIndex = name.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < name.length - 1;
  if (!hasExtension) return `${name.slice(0, Math.max(maxLength - 3, 1))}...`;

  const extension = name.slice(lastDotIndex);
  const baseName = name.slice(0, lastDotIndex);
  const minBaseLength = 4;

  if (extension.length + 3 + minBaseLength > maxLength) {
    return `${name.slice(0, Math.max(maxLength - 3, 1))}...`;
  }

  const visibleBaseLength = maxLength - extension.length - 3;
  return `${baseName.slice(0, visibleBaseLength)}...${extension}`;
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
  if (isFileLikeMessageType(messageType)) {
    return getAttachmentFileName(msg) || 'Attachment';
  }
  return '';
};

const normalizeMessageType = (msg: ApiMessage) => {
  const rawType = msg.message_type || 'text';
  return isFileLikeMessageType(rawType) ? 'file' : rawType;
};

const shouldShowMessageText = (message: ThreadMessage) => {
  if (isMessageDeleted(message.raw)) return true;

  const text = message.text.trim();
  if (!text) return false;

  if (message.messageType === 'image') {
    const normalized = text.toLowerCase();
    return normalized !== 'image' && normalized !== 'image attachment';
  }

  if (message.messageType === 'audio') {
    return false;
  }

  if (isFileLikeMessageType(message.messageType)) {
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

const areMessagesLikelySameOutgoing = (
  local: ThreadMessage,
  incoming: ThreadMessage
) => {
  if (!local.mine || local.status !== 'sending') return false;
  if (local.messageType !== incoming.messageType) return false;

  if (incoming.messageType === 'text') {
    return local.text.trim() === incoming.text.trim();
  }

  const localFileName = (local.fileName || '').trim().toLowerCase();
  const incomingFileName = (incoming.fileName || '').trim().toLowerCase();
  if (localFileName && incomingFileName) {
    return localFileName === incomingFileName;
  }

  return local.text.trim() === incoming.text.trim();
};

const clampUnitProgress = (value: number) => Math.min(1, Math.max(0, value));

const toUnitProgress = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value > 1 && value <= 100) {
    return clampUnitProgress(value / 100);
  }
  return clampUnitProgress(value);
};

const getUploadProgressValue = (event: {
  progress?: number;
  loaded?: number;
  total?: number;
}, options?: {
  fallbackTotal?: number;
  previous?: number;
}) => {
  const previous =
    typeof options?.previous === 'number' &&
      Number.isFinite(options.previous) &&
      options.previous >= 0
      ? clampUnitProgress(options.previous)
      : 0;

  const progressValue = toUnitProgress(event.progress);

  const loaded =
    typeof event.loaded === 'number' && Number.isFinite(event.loaded)
      ? event.loaded
      : 0;
  const totalFromEvent =
    typeof event.total === 'number' && Number.isFinite(event.total)
      ? event.total
      : 0;
  const fallbackTotal =
    typeof options?.fallbackTotal === 'number' &&
      Number.isFinite(options.fallbackTotal) &&
      options.fallbackTotal > 0
      ? options.fallbackTotal
      : 0;
  const total = totalFromEvent > 0 ? totalFromEvent : fallbackTotal;

  const byteProgress =
    total > 0 && loaded >= 0
      ? clampUnitProgress(loaded / total)
      : null;

  if (byteProgress !== null && progressValue !== null) {
    return Math.max(previous, byteProgress, progressValue);
  }
  if (byteProgress !== null) {
    return Math.max(previous, byteProgress);
  }
  if (progressValue !== null) {
    return Math.max(previous, progressValue);
  }

  if (loaded > 0) {
    return -loaded;
  }

  return previous;
};

const getProgressPercentText = (progress: number) =>
  `${Math.round(clampUnitProgress(progress) * 100)}%`;

const getProgressAmountText = (progress: number) =>
  `${(Math.abs(progress) / 1024 / 1024).toFixed(1)}MB`;

const getProgressStatusText = (progress: number, transferVerb: string) => {
  if (progress >= 0) {
    return `${transferVerb}... ${getProgressPercentText(progress)}`;
  }
  return `${transferVerb}... ${getProgressAmountText(progress)}`;
};

const getSafDirectoryName = (uri?: string | null) => {
  if (!uri) return '';
  const decoded = decodeURIComponent(uri);
  const fromDocument = decoded.split('/document/')[1] || decoded;
  const pathPart = fromDocument.includes(':')
    ? fromDocument.split(':')[1]
    : fromDocument;
  const segments = pathPart.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
};

const promptSelectDownloadFolder = () =>
  new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      'Select Download Folder',
      'Please select a folder to save downloaded files (recommended: Downloads).',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => finish(false) },
        { text: 'Continue', onPress: () => finish(true) },
      ],
      {
        cancelable: true,
        onDismiss: () => finish(false),
      }
    );
  });

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
  progress?: number;
  progressDirection?: 'upload' | 'download';
  onDownload: (message: ThreadMessage) => void;
  onCancelDownload: (message: ThreadMessage) => void;
};

const MessageRow = memo(function MessageRow({
  item,
  onLongPress,
  onReply,
  onAttachmentPress,
  showSenderInfo,
  progress,
  progressDirection,
  onDownload,
  onCancelDownload,
}: MessageRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const [isImageLoading, setIsImageLoading] = useState(
    item.messageType === 'image' && Boolean(item.fileUrl)
  );

  useEffect(() => {
    if (item.messageType === 'image' && item.fileUrl) {
      setIsImageLoading(true);
      return;
    }
    setIsImageLoading(false);
  }, [item.fileUrl, item.id, item.messageType]);

  const hasProgress = typeof progress === 'number' && Number.isFinite(progress);
  const progressValue = hasProgress ? progress : 0;
  const isUploading =
    progressDirection === 'upload' ||
    (progressDirection === undefined && item.mine && item.status === 'sending');
  const canCancelDownload = hasProgress && !isUploading;
  const transferVerb = isUploading ? 'Uploading' : 'Downloading';
  const imageProgressText = hasProgress
    ? progressValue >= 0
      ? `${transferVerb} ${getProgressPercentText(progressValue)}`
      : `${transferVerb} ${getProgressAmountText(progressValue)}`
    : null;
  const fileTitleText = truncateFileName(getDisplayFileName(item));
  const fileProgressText = hasProgress
    ? getProgressStatusText(progressValue, transferVerb)
    : null;

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
            item.messageType === 'image' && !shouldShowMessageText(item) && !item.replyPreview ? styles.imageOnlyBubble : null,
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
          {item.replyPreview && !isMessageDeleted(item.raw) ? (
            <View style={[
              styles.replyPreviewBox,
              { borderLeftColor: item.mine ? colors.surfaceAlpha53 : colors.primary }
            ]}>
              <AppText
                variant="caption"
                color={item.mine ? colors.surface : colors.primary}
                numberOfLines={1}
                style={{ fontWeight: '700' }}
              >
                {item.replyPreview.senderName}
              </AppText>
              <AppText
                variant="caption"
                color={item.mine ? colors.surfaceAlpha93 : colors.textSecondary}
                numberOfLines={1}
              >
                {item.replyPreview.messageType === 'image'
                  ? 'Image'
                  : isFileLikeMessageType(item.replyPreview.messageType)
                    ? 'Attachment'
                    : item.replyPreview.text}
              </AppText>
            </View>
          ) : null}

          {!isMessageDeleted(item.raw) && item.messageType === 'audio' && item.fileUrl ? (
            <AudioPlayer uri={item.fileUrl} mine={item.mine} progress={progress} />
          ) : !isMessageDeleted(item.raw) && (item.messageType === 'image' || isFileLikeMessageType(item.messageType)) ? (
            <Pressable onPress={() => onAttachmentPress(item)}>
              {item.messageType === 'image' && item.fileUrl ? (
                <View style={styles.imageBubbleWrap}>
                  <ExpoImage
                    source={{ uri: item.fileUrl }}
                    style={styles.imageBubble}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={120}
                    recyclingKey={`${item.id}-${item.fileUrl || ''}`}
                    onLoadStart={() => setIsImageLoading(true)}
                    onLoad={() => setIsImageLoading(false)}
                    onError={() => setIsImageLoading(false)}
                  />
                  {hasProgress ? (
                    <View style={styles.downloadOverlay}>
                      <ActivityIndicator color={colors.surface} size="small" />
                      <AppText variant="caption" color={colors.surface} style={styles.downloadProgressText}>
                        {imageProgressText}
                      </AppText>
                      {canCancelDownload ? (
                        <Pressable
                          style={styles.overlayCancelButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            onCancelDownload(item);
                          }}
                        >
                          <Ionicons name="close" size={14} color={colors.surface} />
                        </Pressable>
                      ) : null}
                    </View>
                  ) : isImageLoading ? (
                    <View style={styles.imageLoadingOverlay}>
                      <ActivityIndicator color={colors.surface} size="small" />
                      <AppText variant="caption" color={colors.surface} style={styles.imageLoadingText}>
                        Loading image...
                      </AppText>
                    </View>
                  ) : (
                    <View style={styles.imagePreviewHint}>
                      <Ionicons
                        name="expand-outline"
                        size={13}
                        color={colors.surface}
                      />
                      <AppText variant="caption" color={colors.surface}>
                        Tap to view
                      </AppText>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[
                  styles.fileCard,
                  item.mine && { backgroundColor: colors.surfaceAlpha91, borderColor: colors.surface }
                ]}>
                  {hasProgress ? (
                    <View style={styles.fileProgressIndicator}>
                      <ActivityIndicator color={item.mine ? colors.surface : colors.primary} size="small" />
                      <AppText
                        variant="caption"
                        color={colors.primary}
                        style={styles.fileProgressPercent}
                        numberOfLines={1}
                      >
                        {progressValue >= 0
                          ? getProgressPercentText(progressValue)
                          : getProgressAmountText(progressValue)}
                      </AppText>
                    </View>
                  ) : (
                    <Ionicons
                      name="document-attach-outline"
                      size={16}
                      color={item.mine ? colors.primary : colors.textSecondary}
                    />
                  )}
                  <View style={styles.fileTextWrap}>
                    <AppText
                      style={styles.fileName}
                      color={colors.textPrimary}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                      variant="caption"
                    >
                      {fileTitleText}
                    </AppText>
                    {fileProgressText ? (
                      <AppText
                        style={styles.fileProgress}
                        color={item.mine ? colors.blueDeep : colors.textSecondary}
                        numberOfLines={1}
                        variant="caption"
                      >
                        {fileProgressText}
                      </AppText>
                    ) : null}
                  </View>
                  {!hasProgress && item.fileUrl && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        onDownload(item);
                      }}
                      style={[
                        styles.downloadButton,
                        item.mine ? { backgroundColor: colors.surface } : { backgroundColor: colors.primary }
                      ]}
                    >
                      <Ionicons
                        name="download-outline"
                        size={16}
                        color={item.mine ? colors.primary : colors.surface}
                      />
                    </Pressable>
                  )}
                  {canCancelDownload && item.fileUrl && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        onCancelDownload(item);
                      }}
                      style={[
                        styles.downloadButton,
                        styles.cancelButton,
                      ]}
                    >
                      <Ionicons
                        name="close"
                        size={16}
                        color={colors.surface}
                      />
                    </Pressable>
                  )}
                </View>
              )}
            </Pressable>
          ) : null}

          {shouldShowMessageText(item) ? (
            <AppText color={item.mine ? colors.surface : colors.textPrimary}>{item.text}</AppText>
          ) : null}
          <View style={styles.metaRow}>
            <AppText
              variant="caption"
              color={item.mine ? colors.surfaceAlpha80 : colors.textMuted}
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
                    ? colors.dangerSoft
                    : item.status === 'read'
                      ? colors.surface
                      : colors.surfaceAlpha80
                }
              />
            ) : null}
          </View>
        </View>
      </Pressable >
    </Swipeable >
  );
}, (prev, next) =>
  prev.onLongPress === next.onLongPress &&
  prev.onReply === next.onReply &&
  prev.onAttachmentPress === next.onAttachmentPress &&
  prev.progress === next.progress &&
  prev.progressDirection === next.progressDirection &&
  prev.onCancelDownload === next.onCancelDownload &&
  areThreadMessagesEqual(prev.item, next.item)
);

export default function ChatThreadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
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
  const flatListRef = useRef<React.ComponentRef<typeof FlashList<ThreadMessage>> | null>(null);
  const hasInitiallyPositionedRef = useRef(false);
  const isAtBottomRef = useRef(true);

  const handleScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;

    const isAtBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;

    isAtBottomRef.current = isAtBottom;
  }, []);

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
  const [recording, setRecording] = useState<AudioRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [replyingTo, setReplyingTo] = useState<ThreadMessage | null>(null);
  const [messageMenuVisible, setMessageMenuVisible] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ThreadMessage | null>(null);
  const [readInfoVisible, setReadInfoVisible] = useState(false);
  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [attachmentPopupVisible, setAttachmentPopupVisible] = useState(false);
  const markedReadRef = useRef<Set<string>>(new Set());
  const downloadDirectoryUriRef = useRef<string | null>(null);
  const activeDownloadTasksRef = useRef<Record<string, FileSystem.DownloadResumable | undefined>>({});
  const canceledDownloadIdsRef = useRef<Set<string>>(new Set());

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
      const firstPageMessages = Array.isArray(newPages[0]?.messages)
        ? (newPages[0].messages as ApiMessage[])
        : [];
      const exists = firstPageMessages.some(
        (existing) => existing?.uid && existing.uid === msg.uid
      );
      if (exists) return old;
      // API returns newest first. We add the newest message at the top of the first page.
      newPages[0] = {
        ...newPages[0],
        messages: [msg, ...firstPageMessages],
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
    const seen = new Set<string>();

    // Pages are returned newest-first (Page 1 = messages 100-50, Page 2 = 50-0)
    // We want to reverse pages so we have [OlderPage, NewerPage]
    // Then reverse messages in each page so we have [OlderMessage, NewerMessage]
    return [...messagesQueryData.pages]
      .reverse()
      .flatMap((page) => {
        if (!Array.isArray(page.messages)) return [];
        return [...page.messages].reverse();
      })
      .filter((message) => {
        if (!message?.uid || seen.has(message.uid)) return false;
        seen.add(message.uid);
        return true;
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
    isAtBottomRef.current = true;
    hasInitiallyPositionedRef.current = false;
    setMessages([]);
  }, [chatId]);

  useEffect(() => {
    if (isFocused && chatId) {
      void refetchMessages();
    }
  }, [chatId, isFocused, refetchMessages]);

  const recordingRef = useRef<AudioRecorder | null>(null);
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stop().catch(() => { });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          clientId: localMsg.clientId,
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
    if (!messages.length) return;

    if (!hasInitiallyPositionedRef.current) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        hasInitiallyPositionedRef.current = true;
      });
      return;
    }

    if (isAtBottomRef.current) {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages]);

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

  const upsertServerMessage = useCallback(
    (msg: ApiMessage, options?: { tempId?: string }) => {
      const mapped = mapApiMessage(msg);
      setMessages((prev) => {
        const next = [...prev];
        const explicitTempIndex = options?.tempId
          ? next.findIndex(
            (item) => item.id === options.tempId || item.clientId === options.tempId
          )
          : -1;
        const matchedOptimisticIndex =
          explicitTempIndex !== -1
            ? explicitTempIndex
            : next.findIndex((item) => areMessagesLikelySameOutgoing(item, mapped));
        const existingServerIndex = next.findIndex((item) => item.id === mapped.id);

        if (matchedOptimisticIndex !== -1) {
          const optimistic = next[matchedOptimisticIndex];
          next[matchedOptimisticIndex] = {
            ...mapped,
            // Keep key stable to avoid remount flicker after confirmation
            clientId: optimistic.clientId || optimistic.id,
            // Preserve local read status if it was already applied
            status: optimistic.status === 'read' ? 'read' : mapped.status,
          };
          if (
            existingServerIndex !== -1 &&
            existingServerIndex !== matchedOptimisticIndex
          ) {
            next.splice(existingServerIndex, 1);
          }
          return next;
        }

        if (existingServerIndex !== -1) {
          const existing = next[existingServerIndex];
          next[existingServerIndex] = {
            ...mapped,
            clientId: existing.clientId,
            status: existing.status === 'read' ? 'read' : mapped.status,
          };
          return next;
        }

        return [...next, mapped];
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

        upsertServerMessage(rawMessage);

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
    [chatId, isMineMessage, upsertServerMessage]
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
    if (isFileLikeMessageType(replyingTo.messageType)) {
      return truncateFileName(getDisplayFileName(replyingTo));
    }
    return replyingTo.text || 'Message';
  }, [replyingTo]);

  const sendTextMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ThreadMessage = {
      clientId: tempId,
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
        syncMessageToCache(confirmed);
        upsertServerMessage(confirmed, { tempId });
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
    name,
    replyComposerText,
    replyingTo,
    sending,
    syncMessageToCache,
    upsertServerMessage,
  ]);

  const handlePickDocument = useCallback(async () => {
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
        isImage: false, // Always treat as document if picked via document picker
      });
    } catch {
      Alert.alert('Attachment', 'Unable to pick file.');
    }
  }, []);

  const handlePickGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Gallery access is required to pick photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setPendingAttachment({
        uri: asset.uri,
        name: asset.fileName || `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
        isImage: true,
      });
    } catch {
      Alert.alert('Attachment', 'Unable to pick image from gallery.');
    }
  }, []);

  const handlePickCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setPendingAttachment({
        uri: asset.uri,
        name: asset.fileName || `camera-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
        isImage: true,
      });
    } catch {
      Alert.alert('Attachment', 'Unable to use camera.');
    }
  }, []);

  const handleSelectAttachmentAction = useCallback((type: AttachmentActionType) => {
    if (type === 'gallery') {
      void handlePickGallery();
    } else if (type === 'camera') {
      void handlePickCamera();
    } else if (type === 'document') {
      void handlePickDocument();
    }
  }, [handlePickGallery, handlePickCamera, handlePickDocument]);

  const sendAttachmentMessage = useCallback(async () => {
    if (!pendingAttachment || sending) return;

    const caption = input.trim();
    const tempId = `temp-file-${Date.now()}`;
    const messageType = pendingAttachment.isImage ? 'image' : 'file';

    const optimistic: ThreadMessage = {
      clientId: tempId,
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
    setDownloadProgress((prev) => ({ ...prev, [tempId]: 0 }));
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
      let fallbackTotal =
        typeof pendingAttachment.size === 'number' &&
          Number.isFinite(pendingAttachment.size) &&
          pendingAttachment.size > 0
          ? pendingAttachment.size
          : undefined;
      if (!fallbackTotal) {
        try {
          const localInfo = await FileSystem.getInfoAsync(pendingAttachment.uri);
          const size = (localInfo as { size?: unknown })?.size;
          if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
            fallbackTotal = size;
          }
        } catch {
          fallbackTotal = undefined;
        }
      }

      await uploadFileToPresignedPost(presigned, uploadFile, (event) => {
        setDownloadProgress((prev) => {
          const previous = prev[tempId];
          const progressValue = getUploadProgressValue(event, {
            fallbackTotal,
            previous: typeof previous === 'number' ? previous : undefined,
          });
          return { ...prev, [tempId]: progressValue };
        });
      });

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
        syncMessageToCache(confirmed);
        upsertServerMessage(confirmed, { tempId });
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
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
    }
  }, [
    chatId,
    input,
    name,
    pendingAttachment,
    replyComposerText,
    replyingTo,
    sending,
    syncMessageToCache,
    upsertServerMessage,
  ]);

  const startRecording = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone access is required to record audio.');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      const RecorderCtor = (AudioModule as any).AudioRecorder as new (
        options: unknown
      ) => AudioRecorder;
      const newRecording = new RecorderCtor(RecordingPresets.HIGH_QUALITY);
      await newRecording.prepareToRecordAsync();
      newRecording.record();

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      const interval = setInterval(() => {
        const status = newRecording.getStatus();
        setRecordingDuration(Math.floor(status.durationMillis / 1000));
      }, 1000);
      recordingTimerRef.current = interval;
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return null;
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      await recording.stop();
      await setAudioModeAsync({
        allowsRecording: false,
      });
      const uri = recording.uri;
      setRecording(null);
      setRecordingDuration(0);
      return uri;
    } catch (err) {
      console.error('Failed to stop recording', err);
      return null;
    }
  }, [recording]);

  const cancelRecording = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  const sendAudioMessage = useCallback(async (uri: string) => {
    if (!uri || sending) return;

    const tempId = `temp-audio-${Date.now()}`;
    const mappedUri = uri;

    const optimistic: ThreadMessage = {
      clientId: tempId,
      id: tempId,
      mine: true,
      text: 'Voice message',
      time: formatTime(new Date().toISOString()),
      status: 'sending',
      messageType: 'audio',
      fileUrl: mappedUri,
      fileName: 'voice-note.m4a',
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
        content: 'Voice message',
        message_type: 'audio',
        file_name: 'voice-note.m4a',
        file_url: mappedUri,
      },
    };

    setMessages((prev) => [...prev, optimistic]);
    setDownloadProgress((prev) => ({ ...prev, [tempId]: 0 }));
    setReplyingTo(null);

    try {
      setSending(true);

      const presigned = await generatePresignedUploadUrl({
        file_name: `voice-note-${Date.now()}.m4a`,
        folder: 'chat',
      });

      if (!presigned?.success) {
        throw new Error('Unable to generate upload URL');
      }

      const uploadFile: PresignedUploadFile = {
        uri: mappedUri,
        name: `voice-note-${Date.now()}.m4a`,
        type: 'audio/m4a',
      };
      let fallbackTotal: number | undefined;
      try {
        const localInfo = await FileSystem.getInfoAsync(mappedUri);
        const size = (localInfo as { size?: unknown })?.size;
        if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
          fallbackTotal = size;
        }
      } catch {
        fallbackTotal = undefined;
      }

      await uploadFileToPresignedPost(presigned, uploadFile, (event) => {
        setDownloadProgress((prev) => {
          const previous = prev[tempId];
          const progressValue = getUploadProgressValue(event, {
            fallbackTotal,
            previous: typeof previous === 'number' ? previous : undefined,
          });
          return { ...prev, [tempId]: progressValue };
        });
      });

      const uploadedUrl = getUploadedFileUrl(presigned);
      if (!uploadedUrl) {
        throw new Error('Uploaded URL missing');
      }

      const payload: Record<string, unknown> = {
        content: 'Voice message',
        message_type: 'audio',
        file_url: uploadedUrl,
        file: uploadedUrl,
        attachment_url: uploadedUrl,
        file_name: `voice-note-${Date.now()}.m4a`,
        original_filename: `voice-note-${Date.now()}.m4a`,
        s3_key: presigned.s3_key,
        content_type: 'audio/m4a',
      };

      if (optimistic.replyPreview?.id) {
        payload.reply_to = optimistic.replyPreview.id;
      }

      const response = await createMessage(chatId, payload);
      const confirmed = response?.message as ApiMessage | undefined;

      if (confirmed?.uid) {
        syncMessageToCache(confirmed);
        upsertServerMessage(confirmed, { tempId });
      } else {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempId
              ? { ...message, status: 'delivered', fileUrl: uploadedUrl }
              : message
          )
        );
      }
    } catch (err: any) {
      const messageError =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to send audio message';

      setMessages((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, status: 'failed' } : item
        )
      );
      Alert.alert('Message failed', messageError);
    } finally {
      setSending(false);
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
    }
  }, [
    chatId, name, replyComposerText, replyingTo, sending, syncMessageToCache, upsertServerMessage
  ]);

  const stopAndSendRecording = useCallback(async () => {
    const uri = await stopRecording();
    if (uri) {
      void sendAudioMessage(uri);
    }
  }, [stopRecording, sendAudioMessage]);

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

  const handleShareFile = useCallback(async (uri: string, fileName?: string | null) => {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Sharing', 'Sharing is not available on this device.');
        return;
      }

      const name = (fileName || uri.split('/').pop() || 'attachment').replace(/[^a-zA-Z0-9.]/g, '_');
      const fileUri = FileSystem.cacheDirectory + name;

      const downloadResult = await FileSystem.downloadAsync(uri, fileUri);
      if (downloadResult.status !== 200) {
        throw new Error('Failed to download file');
      }

      await Sharing.shareAsync(downloadResult.uri, {
        dialogTitle: 'Open with',
      });
    } catch {
      Alert.alert('Error', 'Unable to open file with other apps.');
    }
  }, []);

  const isImageFile = useCallback((fileName?: string | null) => {
    const name = (fileName || '').toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name);
  }, []);

  const getMimeType = useCallback((fileName?: string | null) => {
    const ext = (fileName || '').split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc':
      case 'docx': return 'application/msword';
      case 'xls':
      case 'xlsx': return 'application/vnd.ms-excel';
      case 'ppt':
      case 'pptx': return 'application/vnd.ms-powerpoint';
      case 'txt': return 'text/plain';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      default: return '*/*';
    }
  }, []);

  const resolveAndroidDownloadDirectoryUri = useCallback(async () => {
    const saf = FileSystem.StorageAccessFramework;

    const tryExistingDirectory = async (uri?: string | null) => {
      if (!uri) return null;
      try {
        await saf.readDirectoryAsync(uri);
        return uri;
      } catch {
        return null;
      }
    };

    const cachedUri = await tryExistingDirectory(downloadDirectoryUriRef.current);
    if (cachedUri) return cachedUri;

    const persistedUri = await SecureStore.getItemAsync(DOWNLOAD_DIR_URI_KEY);
    const persistedDirectory = await tryExistingDirectory(persistedUri);
    if (persistedDirectory) {
      downloadDirectoryUriRef.current = persistedDirectory;
      return persistedDirectory;
    }

    const defaultDownloadUri = saf.getUriForDirectoryInRoot('Download');
    const existingDownloadUri = await tryExistingDirectory(defaultDownloadUri);
    if (existingDownloadUri) {
      downloadDirectoryUriRef.current = existingDownloadUri;
      const existingChildren = await saf.readDirectoryAsync(existingDownloadUri);
      const existingAppFolder = existingChildren.find(
        (childUri) => getSafDirectoryName(childUri) === APP_DOWNLOADS_FOLDER_NAME
      );

      const resolvedUri = existingAppFolder || await saf.makeDirectoryAsync(
        existingDownloadUri,
        APP_DOWNLOADS_FOLDER_NAME
      ).catch(() => existingDownloadUri);

      downloadDirectoryUriRef.current = resolvedUri;
      await SecureStore.setItemAsync(DOWNLOAD_DIR_URI_KEY, resolvedUri);
      return resolvedUri;
    }

    // Do not force-select root Download folder; some OEMs (Realme/Oppo) can reject it.
    // Let user pick any allowed folder once, then persist that grant.
    const shouldContinue = await promptSelectDownloadFolder();
    if (!shouldContinue) {
      throw new Error('Folder selection cancelled');
    }

    const permission = await saf.requestDirectoryPermissionsAsync();
    if (!permission.granted || !permission.directoryUri) {
      throw new Error('Storage permission not granted');
    }

    const grantedUri = permission.directoryUri;
    const grantedName = getSafDirectoryName(grantedUri);

    let finalDirectoryUri = grantedUri;
    if (grantedName !== APP_DOWNLOADS_FOLDER_NAME) {
      try {
        const children = await saf.readDirectoryAsync(grantedUri);
        const existingAppFolder = children.find(
          (childUri) => getSafDirectoryName(childUri) === APP_DOWNLOADS_FOLDER_NAME
        );
        if (existingAppFolder) {
          finalDirectoryUri = existingAppFolder;
        } else {
          finalDirectoryUri = await saf.makeDirectoryAsync(
            grantedUri,
            APP_DOWNLOADS_FOLDER_NAME
          );
        }
      } catch {
        finalDirectoryUri = grantedUri;
      }
    }

    downloadDirectoryUriRef.current = finalDirectoryUri;
    await SecureStore.setItemAsync(DOWNLOAD_DIR_URI_KEY, finalDirectoryUri);
    return finalDirectoryUri;
  }, []);

  const saveFileToAndroidStorage = useCallback(async (
    localUri: string,
    fileName: string,
    mimeType: string
  ) => {
    const saf = FileSystem.StorageAccessFramework;
    const directoryUri = await resolveAndroidDownloadDirectoryUri();

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const dotIndex = safeFileName.lastIndexOf('.');
    const baseName = dotIndex > 0 ? safeFileName.slice(0, dotIndex) : safeFileName;
    const extension = dotIndex > 0 ? safeFileName.slice(dotIndex) : '';

    let destinationUri: string;
    try {
      destinationUri = await saf.createFileAsync(
        directoryUri,
        safeFileName,
        mimeType
      );
    } catch {
      destinationUri = await saf.createFileAsync(
        directoryUri,
        `${baseName}-${Date.now()}${extension}`,
        mimeType
      );
    }

    try {
      await saf.copyAsync({
        from: localUri,
        to: destinationUri,
      });
    } catch {
      // Fallback for devices where SAF copy can be flaky.
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await saf.writeAsStringAsync(destinationUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  }, [resolveAndroidDownloadDirectoryUri]);

  const handleOpenWith = useCallback(async (message: ThreadMessage) => {
    const { fileUrl, fileName } = message;
    if (!fileUrl) return;

    try {
      const name = (fileName || fileUrl.split('/').pop() || 'attachment').replace(/[^a-zA-Z0-9.]/g, '_');
      const fileUri = FileSystem.cacheDirectory + name;

      // Check if file exists in cache first to be fast
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      let localUri = fileUri;

      if (!fileInfo.exists) {
        // Download if not in cache
        const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);
        if (downloadResult.status !== 200) {
          throw new Error('Failed to download file for opening');
        }
        localUri = downloadResult.uri;
      }

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(localUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: getMimeType(fileName),
        });
      } else {
        // On iOS, Sharing.shareAsync provides the "Open in..." options
        await Sharing.shareAsync(localUri);
      }
    } catch (err) {
      // console.error('Open with error:', err);
      Alert.alert('Error', 'Unable to open file. Please try downloading it first.');
    }
  }, [getMimeType]);

  const clearDownloadState = useCallback((messageId: string) => {
    delete activeDownloadTasksRef.current[messageId];
    canceledDownloadIdsRef.current.delete(messageId);
    setDownloadProgress((prev) => {
      const next = { ...prev };
      delete next[messageId];
      return next;
    });
  }, []);

  const handleCancelDownload = useCallback(async (message: ThreadMessage) => {
    const messageId = message.id;
    const task = activeDownloadTasksRef.current[messageId];

    canceledDownloadIdsRef.current.add(messageId);

    if (task) {
      try {
        await task.cancelAsync();
      } catch {
        // ignore cancellation errors
      }
    }

    clearDownloadState(messageId);
  }, [clearDownloadState]);

  const handleDownload = useCallback(async (message: ThreadMessage) => {
    const { fileUrl, fileName, id } = message;
    if (!fileUrl) return;

    try {
      const name = (fileName || fileUrl.split('/').pop() || 'attachment').replace(/[^a-zA-Z0-9.]/g, '_');
      const fileUri = FileSystem.cacheDirectory + name;

      // Check if already downloading
      if (downloadProgress[id] !== undefined) return;

      // Start by setting an initial progress to show we've started
      setDownloadProgress((prev) => ({ ...prev, [id]: 0.0001 }));
      canceledDownloadIdsRef.current.delete(id);

      let fallbackTotalSize = 0;
      try {
        // Use fetch with HEAD for better platform compatibility
        const headRes = await fetch(fileUrl, { method: 'HEAD' });
        const len = headRes.headers.get('content-length');
        if (len) fallbackTotalSize = parseInt(len, 10);
      } catch (e) {
        // console.warn('HEAD check failed', e);
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        fileUri,
        {},
        (p) => {
          const totalFromSrv = p.totalBytesExpectedToWrite;
          const total = totalFromSrv > 0 ? totalFromSrv : fallbackTotalSize;
          const written = p.totalBytesWritten;

          if (total > 0) {
            const val = Math.min(1, Math.max(0, written / total));
            setDownloadProgress((prev) => ({ ...prev, [id]: val }));
          } else {
            // Indeterminate size: Store the negative of written bytes to signify "indeterminate"
            // We can use this in the UI to show MB downloaded
            setDownloadProgress((prev) => ({ ...prev, [id]: -written }));
          }
        }
      );
      activeDownloadTasksRef.current[id] = downloadResumable;

      const downloadResult = await downloadResumable.downloadAsync();
      const wasCancelled = canceledDownloadIdsRef.current.has(id);
      if (!downloadResult || wasCancelled) {
        clearDownloadState(id);
        return;
      }
      if (downloadResult?.uri) {
        console.log('Saved file:', downloadResult.uri);
      }
      clearDownloadState(id);

      if (downloadResult && downloadResult.uri) {
        if (message.messageType === 'image' || isImageFile(fileName)) {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
            Alert.alert('Success', 'Image saved to gallery');
          } else {
            // Fallback to sharing if permission denied
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
              await Sharing.shareAsync(downloadResult.uri);
            } else {
              Alert.alert('Error', 'Storage permission is required to save this image.');
            }
          }
        } else {
          if (Platform.OS === 'android') {
            await saveFileToAndroidStorage(
              downloadResult.uri,
              name,
              getMimeType(fileName)
            );
            await handleOpenWith({
              ...message,
              fileUrl: downloadResult.uri,
              fileName: name,
            });
            Alert.alert(
              'Download Complete',
              `Saved to:\n${APP_DOWNLOADS_FOLDER_NAME} folder\n\nFile: ${name}`
            );
          } else {
            // iOS fallback uses system "Save to Files" sheet.
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (!isSharingAvailable) {
              Alert.alert('Sharing', 'Sharing is not available on this device.');
              return;
            }
            await Sharing.shareAsync(downloadResult.uri, {
              dialogTitle: `Download ${fileName || 'file'}`,
            });
          }
        }
      }
    } catch (err) {
      const wasCancelled = canceledDownloadIdsRef.current.has(id);
      clearDownloadState(id);
      if (wasCancelled) return;

      const errorMessage =
        err instanceof Error ? err.message : '';
      if (errorMessage === 'Folder selection cancelled') {
        Alert.alert('Download Cancelled', 'Folder selection was cancelled.');
      } else {
        console.error('Download error:', err);
        Alert.alert('Error', 'Failed to download file');
      }
    }
  }, [clearDownloadState, downloadProgress, getMimeType, handleOpenWith, isImageFile, saveFileToAndroidStorage]);

  const handleAttachmentPress = useCallback(
    (message: ThreadMessage) => {
      if (!message.fileUrl) {
        Alert.alert('Attachment', 'No file URL found for this attachment.');
        return;
      }

      if (message.messageType === 'image' || isImageFile(message.fileName)) {
        setImagePreview({
          uri: message.fileUrl,
          name: message.fileName,
          messageId: message.id,
        });
        return;
      }

      // For documents/files, use "Open with" logic
      void handleOpenWith(message);
    },
    [isImageFile, handleOpenWith]
  );

  const keyExtractor = useCallback((item: ThreadMessage) => item.clientId || item.id, []);

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

  const handleMenuForward = useCallback(() => {
    setForwardModalVisible(true);
    setMessageMenuVisible(false);
  }, []);

  const handleShowReadInfo = useCallback(() => {
    setMessageMenuVisible(false);
    setReadInfoVisible(true);
  }, []);

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

  const renderMessageItem = useCallback(({ item }: ListRenderItemInfo<ThreadMessage>) => {
    const idProgress = downloadProgress[item.id];
    const clientProgress = item.clientId ? downloadProgress[item.clientId] : undefined;
    const progress = idProgress ?? clientProgress;

    let progressDirection: 'upload' | 'download' | undefined;
    if (idProgress !== undefined) {
      const isTempId = item.id.startsWith('temp-');
      progressDirection = isTempId || item.status === 'sending' ? 'upload' : 'download';
    } else if (clientProgress !== undefined) {
      progressDirection = 'upload';
    }

    return (
      <MessageRow
        item={item}
        onLongPress={handleMessageLongPress}
        onReply={setReplyingTo}
        onAttachmentPress={handleAttachmentPress}
        showSenderInfo={!item.mine && (chatType === 'group' || chatType === 'batch')}
        progress={progress}
        progressDirection={progressDirection}
        onDownload={handleDownload}
        onCancelDownload={handleCancelDownload}
      />
    );
  }, [chatType, handleAttachmentPress, handleCancelDownload, handleMessageLongPress, downloadProgress, handleDownload]);

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

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isMicButton = input.trim() === '' && !pendingAttachment;

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
          <Ionicons name="chevron-back" size={24} color={colors.surface} />
        </Pressable>

        <Pressable
          style={styles.headerTitleContainer}
          onPress={() => {
            if (chatType === 'group') {
              navigation.navigate('GroupDetails', { chatId, chatType });
            }
          }}
          disabled={chatType !== 'group'}
        >
          <HeaderAvatar label={name} avatarColor={avatarColor} uri={profilePic} />

          <View style={styles.headerTitleWrap}>
            <AppText variant="subtitle" color={colors.surface} style={{ fontWeight: '800' }}>
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
        </Pressable>

        <View style={styles.headerRight}>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="call-outline" size={20} color={colors.surface} />
          </Pressable>
          <Pressable style={styles.headerIcon}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.surface} />
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
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={handleMenuForward}>
              <Ionicons name="arrow-redo-outline" size={20} color={colors.textPrimary} />
              <AppText style={styles.menuItemText}>Forward</AppText>
            </Pressable>
            {selectedMessage?.mine && (
              <>
                <View style={styles.menuDivider} />
                <Pressable style={styles.menuItem} onPress={handleShowReadInfo}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.textPrimary} />
                  <AppText style={styles.menuItemText}>Info</AppText>
                </Pressable>
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
            <AppText color={colors.surface} numberOfLines={1} style={styles.imagePreviewTitle}>
              {imagePreview?.name || 'Image preview'}
            </AppText>

            <View style={styles.imagePreviewActions}>
              <Pressable
                style={styles.imagePreviewAction}
                onPress={() => void openAttachmentUrl(imagePreview?.uri)}
              >
                <Ionicons name="open-outline" size={20} color={colors.surface} />
              </Pressable>
              {imagePreview?.uri && (
                <Pressable
                  style={styles.imagePreviewAction}
                  onPress={() => {
                    const msg = messages.find(m => m.id === imagePreview.messageId);
                    if (msg) {
                      void handleDownload(msg);
                    } else {
                      // Fallback if message not found in current list (rare)
                      void handleDownload({
                        id: imagePreview.messageId || 'temp',
                        fileUrl: imagePreview.uri,
                        fileName: imagePreview.name,
                        messageType: 'image',
                        mine: false,
                        text: '',
                        time: '',
                        raw: {} as any,
                      });
                    }
                  }}
                  disabled={Boolean(imagePreview.messageId && downloadProgress[imagePreview.messageId])}
                >
                  {imagePreview.messageId && downloadProgress[imagePreview.messageId] !== undefined ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Ionicons name="download-outline" size={20} color={colors.surface} />
                  )}
                </Pressable>
              )}
              <Pressable
                style={styles.imagePreviewAction}
                onPress={() => setImagePreview(null)}
              >
                <Ionicons name="close" size={22} color={colors.surface} />
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

      <AttachmentPopup
        visible={attachmentPopupVisible}
        onClose={() => setAttachmentPopupVisible(false)}
        onSelect={handleSelectAttachmentAction}
      />

      <MessageReadInfoModal
        visible={readInfoVisible}
        onClose={() => setReadInfoVisible(false)}
        chatUid={chatId}
        messageUid={selectedMessage?.id || ''}
      />

      <FlashList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        style={styles.messagesArea}
        contentContainerStyle={styles.messagesList}
        maintainVisibleContentPosition={{
          startRenderingFromBottom: true,
          autoscrollToBottomThreshold: 0.05,
          animateAutoScrollToBottom: false,
        }}
        keyboardDismissMode={
          Platform.OS === 'ios' ? 'interactive' : 'on-drag'
        }
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      <View
        style={[
          styles.composerWrap,
          { paddingBottom: composerBottomPadding },
        ]}
      >
        {!isRecording && (
          <Pressable style={styles.attachButton} onPress={() => setAttachmentPopupVisible(true)}>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}

        {isRecording ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <AppText style={styles.recordingTime}>
                {formatRecordingTime(recordingDuration)}
              </AppText>
            </View>
            <AppText color={colors.textMuted} variant="caption">
              Recording...
            </AppText>
            <Pressable style={styles.cancelRecordButton} onPress={cancelRecording}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.composerInputWrap}>
            {replyingTo ? (
              <View style={styles.replyingComposerBar}>
                <View style={styles.replyingTextWrap}>
                  <AppText variant="caption" color={colors.successDeep} numberOfLines={1}>
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
              <Pressable style={styles.smallAction} onPress={handlePickCamera}>
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        )}

        <Pressable
          style={[
            styles.sendButton,
            sending && styles.sendButtonDisabled,
            isRecording && styles.sendButtonRecording,
          ]}
          onPress={isRecording ? stopAndSendRecording : (isMicButton ? startRecording : handleSend)}
          disabled={sending}
        >
          <Ionicons name={isRecording || !isMicButton ? 'send' : 'mic'} size={16} color={colors.surface} />
        </Pressable>
      </View>

      <ForwardMessageModal
        visible={forwardModalVisible}
        messageContent={selectedMessage?.raw?.content || selectedMessage?.text || null}
        messageType={selectedMessage?.messageType || 'text'}
        onClose={() => {
          setForwardModalVisible(false);
          setSelectedMessage(null);
        }}
        onForwardSuccess={() => {
          Alert.alert('Success', 'Message forwarded successfully');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  chatBody: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.xs,
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
    backgroundColor: colors.background,
  },
  messagesList: {
    padding: spacing.lg,
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
    marginBottom: 8,
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  imageOnlyBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  replyPreviewBox: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
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
    minWidth: 190,
    maxWidth: '100%',
  },
  fileName: {
    flexShrink: 1,
    fontWeight: '500',
    fontSize: 12,
  },
  fileTextWrap: {
    flexShrink: 1,
    minWidth: 90,
    maxWidth: 190,
    gap: 2,
  },
  fileProgress: {
    fontSize: 11,
  },
  fileProgressIndicator: {
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  fileProgressPercent: {
    fontSize: 10,
    fontWeight: '600',
  },
  downloadButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: colors.danger,
  },
  imageBubbleWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    width: 240,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imageLoadingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  overlayCancelButton: {
    marginTop: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.85)',
  },
  imageBubble: {
    width: '100%',
    height: 240,
    backgroundColor: colors.border,
  },
  imagePreviewHint: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 6,
    zIndex: 10,
  },
  downloadProgressText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    gap: spacing.sm,
    shadowColor: colors.black,
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
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  composerInputWrap: {
    flex: 1,
    minHeight: 44,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
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
    backgroundColor: colors.surface,
    shadowColor: colors.black,
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
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.overlayStrong,
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
    backgroundColor: colors.surfaceAlpha14,
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
  recordingBar: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    opacity: 0.8,
  },
  recordingTime: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cancelRecordButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.danger + '15',
  },
  sendButtonRecording: {
    backgroundColor: colors.danger,
  },
});
