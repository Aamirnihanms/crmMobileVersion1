import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import {
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getChatList, type ApiChat, type ChatType } from './src/api/chat.api';
import NoNetworkScreen from './src/components/global/NoNetworkScreen';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import { getFCMToken, requestUserPermission } from './src/lib/firebaseHelper';
import { configureNotificationChannel, showForegroundNotification } from './src/lib/notificationHelper';
import { queryClient } from './src/lib/queryClient';
import {
  scheduleUnreadCountRefresh,
  setUnreadCountInCache,
} from './src/lib/unreadCount';
import type { DashboardStackParamList } from './src/navigation/DashboardStack';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/auth.store';
import { colors } from './src/theme';

const navigationRef = createNavigationContainerRef<any>();

type ChatThreadParams = DashboardStackParamList['ChatThread'];
type NotificationData = Record<string, unknown> | undefined;
type ChatListInfiniteData = {
  pages?: { results?: ApiChat[] }[];
};

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const getNumberValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const resolveChatType = (value: unknown): ChatType =>
  value === 'group' || value === 'batch' ? value : 'individual';

const getAvatarColorByChatType = (chatType: ChatType) =>
  chatType === 'group'
    ? colors.chatGroupBg
    : chatType === 'batch'
      ? colors.chatBatchBg
      : colors.chatDirectBg;

const getChatFromCache = (chatUid: string): ApiChat | null => {
  const allChatQueries = queryClient.getQueriesData({
    queryKey: ['chat-list'],
  });

  for (const [, value] of allChatQueries) {
    const data = value as ChatListInfiniteData | undefined;
    const pages = Array.isArray(data?.pages) ? data.pages : [];
    for (const page of pages) {
      const results = Array.isArray(page?.results) ? page.results : [];
      const found = results.find((chat) => chat.uid === chatUid);
      if (found) return found;
    }
  }

  return null;
};

const findChatByUid = async (chatUid: string) => {
  const MAX_PAGES = 6;
  const PAGE_SIZE = 50;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await getChatList({ page, page_size: PAGE_SIZE });
    const results = Array.isArray(res?.results) ? res.results : [];
    const found = results.find((chat) => chat.uid === chatUid);
    if (found) return found;
    if (!res?.next) break;
  }

  return null;
};

const mergeChatMetaIntoParams = (
  params: ChatThreadParams,
  chat: ApiChat,
): ChatThreadParams => {
  const chatType = resolveChatType(chat.chat_type || params.chatType);
  const other = chat.other_participant || null;
  const inferredName =
    (chatType === 'group' && chat.group_name) ||
    (chatType === 'batch' && chat.batch_name) ||
    other?.full_name ||
    other?.name ||
    params.name;
  const inferredProfilePic =
    (chatType === 'group' ? chat.group_icon : other?.profile_pic) ??
    params.profilePic ??
    null;

  return {
    ...params,
    chatType,
    name: inferredName || params.name,
    profilePic: inferredProfilePic,
    participantId:
      chatType === 'individual'
        ? other?.id ?? params.participantId
        : params.participantId,
    online:
      chatType === 'individual'
        ? Boolean(other?.is_active ?? params.online)
        : params.online,
    avatarColor: getAvatarColorByChatType(chatType),
  };
};

const getChatParamsFromNotification = (
  data: NotificationData,
  fallbackTitle?: string,
): ChatThreadParams | null => {
  const chatId = getStringValue(data?.chat_uid);
  if (!chatId) return null;

  const rawType = getStringValue(data?.type);
  if (rawType && rawType !== 'chat_message') return null;

  const chatType = resolveChatType(getStringValue(data?.chat_type));

  const chatName = getStringValue(data?.chat_name)?.trim();
  const senderName = getStringValue(data?.sender_name)?.trim();
  const normalizedTitle = fallbackTitle?.trim();
  const titleBasedName =
    normalizedTitle && normalizedTitle.toLowerCase() !== 'new message'
      ? normalizedTitle
      : undefined;

  const name =
    chatName ||
    senderName ||
    titleBasedName ||
    (chatType === 'group'
      ? 'Group Chat'
      : chatType === 'batch'
        ? 'Batch Chat'
        : 'Chat');

  const avatarColor = getAvatarColorByChatType(chatType);
  const profilePic =
    getStringValue(data?.chat_profile_pic) ||
    getStringValue(data?.sender_profile_pic) ||
    (chatType === 'group' ? getStringValue(data?.group_icon) : undefined) ||
    null;
  const participantId =
    chatType === 'individual'
      ? getNumberValue(data?.sender_id)
      : undefined;
  const online = data?.sender_online === true;

  return {
    chatId,
    name,
    avatarColor,
    chatType,
    profilePic,
    participantId,
    online,
  };
};

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { isOffline, checkNetwork } = useNetworkStatus();
  const pendingChatRef = useRef<ChatThreadParams | null>(null);
  const lastHandledKeyRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      void NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  const navigateToChatThread = useCallback((params: ChatThreadParams) => {
    if (!navigationRef.isReady()) {
      pendingChatRef.current = params;
      return;
    }

    navigationRef.navigate('Dashboard', {
      screen: 'ChatThread',
      params,
    });
  }, []);

  const resolveChatParamsWithLookup = useCallback(
    async (params: ChatThreadParams) => {
      if (params.profilePic) {
        return params;
      }

      try {
        const cachedChat = getChatFromCache(params.chatId);
        if (cachedChat) {
          return mergeChatMetaIntoParams(params, cachedChat);
        }

        if (isLoggedIn) {
          const fetchedChat = await findChatByUid(params.chatId);
          if (fetchedChat) {
            return mergeChatMetaIntoParams(params, fetchedChat);
          }
        }
      } catch {
        // fallback to notification payload only
      }

      return params;
    },
    [isLoggedIn],
  );

  const flushPendingChatNavigation = useCallback(() => {
    if (!isLoggedIn || !navigationRef.isReady() || !pendingChatRef.current) {
      return;
    }

    const pending = pendingChatRef.current;
    pendingChatRef.current = null;
    void resolveChatParamsWithLookup(pending).then((resolved) => {
      navigateToChatThread(resolved);
    });
  }, [isLoggedIn, navigateToChatThread, resolveChatParamsWithLookup]);

  const handleNotificationData = useCallback(
    async (data: NotificationData, fallbackTitle?: string) => {
      if (!data) return;

      // Handle General Notifications from WebSocket or FCM
      if (data.type === 'new_notification') {
        if (!navigationRef.isReady()) return;
        navigationRef.navigate('Dashboard', { screen: 'Notifications' });
        return;
      }

      // Handle Chat Notifications
      const params = getChatParamsFromNotification(data, fallbackTitle);
      if (!params) return;

      const messageKey =
        getStringValue(data?.message_uid) || `${params.chatId}:${params.chatType}`;
      const lastHandled = lastHandledKeyRef.current;
      const now = Date.now();
      if (
        lastHandled &&
        lastHandled.key === messageKey &&
        now - lastHandled.at < 3000
      ) {
        return;
      }
      lastHandledKeyRef.current = { key: messageKey, at: now };

      const resolvedParams = await resolveChatParamsWithLookup(params);

      if (!isLoggedIn) {
        pendingChatRef.current = resolvedParams;
        return;
      }

      navigateToChatThread(resolvedParams);
    },
    [isLoggedIn, navigateToChatThread, resolveChatParamsWithLookup],
  );

  const setupDoneRef = useRef(false);

  useEffect(() => {
    // Request permission and get token
    const setupFCM = async () => {
      if (setupDoneRef.current) return;
      setupDoneRef.current = true;

      console.log('--- Initializing FCM Setup ---');
      await configureNotificationChannel();
      const hasPermission = await requestUserPermission();
      if (hasPermission) {
        await getFCMToken();
      } else {
        console.log('Skipping FCM Token retrieval: Permission not granted');
      }
    };
    setupFCM();

    // Listen to foreground messages
    const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
      console.log('A new FCM message arrived in foreground!', JSON.stringify(remoteMessage));
      await showForegroundNotification(remoteMessage);
      scheduleUnreadCountRefresh(queryClient, { minIntervalMs: 5_000, debounceMs: 300 });
    });

    const messaging = getMessaging();
    const unsubscribeOpened = onNotificationOpenedApp(
      messaging,
      (remoteMessage) => {
        void handleNotificationData(
          remoteMessage?.data as NotificationData,
          remoteMessage?.notification?.title,
        );
      },
    );

    void getInitialNotification(messaging).then((remoteMessage) => {
      if (!remoteMessage) return;
      void handleNotificationData(
        remoteMessage.data as NotificationData,
        remoteMessage.notification?.title || undefined,
      );
    });

    const responseSub =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as NotificationData;
        void handleNotificationData(
          data,
          response.notification.request.content.title || undefined,
        );
      });

    return () => {
      unsubscribe();
      unsubscribeOpened();
      responseSub.remove();
    };
  }, [handleNotificationData]);

  useEffect(() => {
    flushPendingChatNavigation();
  }, [flushPendingChatNavigation, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) return;
    setUnreadCountInCache(queryClient, 0);
  }, [isLoggedIn]);

  const handleNavigationReady = useCallback(() => {
    flushPendingChatNavigation();
  }, [flushPendingChatNavigation]);

  return (
    <KeyboardProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar
            style="dark"
            backgroundColor="transparent"
            translucent
          />
          <QueryClientProvider client={queryClient}>
            <NavigationContainer
              ref={navigationRef}
              onReady={handleNavigationReady}
              theme={appTheme}
            >
              <RootNavigator />
            </NavigationContainer>
          </QueryClientProvider>
          {isOffline && <NoNetworkScreen onRetry={checkNetwork} />}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
}
