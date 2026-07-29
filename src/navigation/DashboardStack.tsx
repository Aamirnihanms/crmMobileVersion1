import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { useChatUnreadCount } from '@/src/queries/chat.query';
import { useNotificationsUnreadCount } from '@/src/queries/notifications.query';
import { useAuthStore } from '@/src/store/auth.store';
import { useAppTheme, spacing } from '@/src/theme';
import ChatThreadScreen from '../screens/chat/ChatThreadScreen';
import MessagesListScreen from '../screens/chat/MessagesListScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import { useNotificationWebSocket } from '../hooks/useNotificationWebSocket';
import NotificationListScreen from '../screens/notifications/NotificationListScreen';

const { width } = Dimensions.get('window');

export type DashboardStackParamList = {
  DashboardHome: undefined;
  MessagesList: undefined;
  ChatThread: {
    chatId: string;
    name: string;
    avatarColor: string;
    profilePic?: string | null;
    online?: boolean;
    participantId?: number;
    chatType?: 'individual' | 'group' | 'batch';
  };
  GroupDetails: {
    chatId: string;
    chatType: 'group' | 'batch';
  };
  Notifications: undefined;
  BatchChangeRequestList: undefined;
  BatchChangeRequestDetail: { uid: string };
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

function HeaderIconButton({
  icon,
  onPress,
  showDot = false,
  badgeCount = 0,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showDot?: boolean;
  badgeCount?: number;
}) {
  const { colors } = useAppTheme();
  const safeBadgeCount = Number.isFinite(badgeCount)
    ? Math.max(0, Math.floor(badgeCount))
    : 0;
  const badgeText = safeBadgeCount > 99 ? '99+' : String(safeBadgeCount);

  return (
    <Pressable
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          position: 'relative',
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 2,
        },
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
      {safeBadgeCount > 0 ? (
        <View style={[styles.countBadge, { borderColor: colors.surface }]}>
          <Text style={styles.countBadgeText}>{badgeText}</Text>
        </View>
      ) : showDot ? (
        <View style={[styles.dot, { borderColor: colors.surface }]} />
      ) : null}
    </Pressable>
  );
}

export default function DashboardStack() {
  const { colors } = useAppTheme();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const authUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const { data: chatData } = useChatUnreadCount(isLoggedIn);
  const { data: notificationsData } = useNotificationsUnreadCount(isLoggedIn);
  const chatUnreadCount = chatData?.unread_count ?? 0;
  const notificationsUnreadCount = notificationsData?.unread_count ?? 0;
  const avatarUri =
    typeof authUser?.profile_picture === 'string' &&
      authUser.profile_picture.trim().length > 0
      ? authUser.profile_picture.trim()
      : null;
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUri]);

  useNotificationWebSocket({
    token: token || '',
    enabled: isLoggedIn && !!token,
  });

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTransparent: false,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={({ navigation }) => ({
          headerTitle: () => null,
          headerLeft: () => (
            <View style={styles.leftActions}>
              <HeaderIconButton
                icon="notifications-outline"
                badgeCount={notificationsUnreadCount}
                showDot={notificationsUnreadCount > 0}
                onPress={() => navigation.navigate('Notifications')}
              />
              <HeaderIconButton
                icon="chatbubble-ellipses-outline"
                badgeCount={chatUnreadCount}
                onPress={() => navigation.navigate('MessagesList')}
              />
            </View>
          ),
          headerRight: () => (
            <Pressable
              style={({ pressed }) => [
                {
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                const parentNav = navigation.getParent() as any;
                parentNav?.navigate('More');
              }}
            >
              <View style={[styles.avatarShell, { backgroundColor: colors.surface }]}>
                {avatarUri && !avatarLoadFailed ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <Ionicons name="person" size={20} color={colors.primary} />
                )}
              </View>
            </Pressable>
          ),
        })}
      />

      <Stack.Screen
        name="MessagesList"
        component={MessagesListScreen}
        options={{ title: 'Messages' }}
      />

      <Stack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupDetails"
        component={require('../screens/chat/GroupDetailsScreen').default}
        options={{ title: 'Group Info', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationListScreen}
        options={{ title: 'Notifications', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="BatchChangeRequestList"
        getComponent={() => require('../screens/more/BatchChangeRequestListScreen').default}
        options={{ title: 'Batch Change Requests' }}
      />
      <Stack.Screen
        name="BatchChangeRequestDetail"
        getComponent={() => require('../screens/more/BatchChangeRequestDetailScreen').default}
        options={{ title: 'Batch Change Detail' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
  },
  countBadge: {
    position: 'absolute',
    top: 5,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderWidth: 1,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarShell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  heroCard: { borderRadius: 24, padding: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, elevation: 10 },
  heroValue: { fontSize: 28, marginVertical: spacing.xs },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8, alignSelf: 'flex-start' },
  heroBadgeText: { marginLeft: 4, fontWeight: '600' },
  heroActions: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4 },
  heroButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 4 },
  heroButtonInactive: { backgroundColor: 'transparent', marginBottom: 0 },
  heroButtonText: { fontWeight: '700', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.sm },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  statCard: { width: (width - spacing.lg * 2 - spacing.md) / 2, padding: spacing.md },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  statIconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trendText: { fontSize: 10, fontWeight: '700' },
  statTitle: { fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 20 },
  activityCard: { padding: spacing.md },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  activityIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  activityContent: { flex: 1 },
  divider: { height: 1, marginVertical: spacing.xs },
});
