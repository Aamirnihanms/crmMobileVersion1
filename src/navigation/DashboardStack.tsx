import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { colors, spacing } from '@/src/theme';
import { useNotificationsUnreadCount } from '@/src/queries/notifications.query';
import { useAuthStore } from '@/src/store/auth.store';
import ChatThreadScreen from '../screens/chat/ChatThreadScreen';
import MessagesListScreen from '../screens/chat/MessagesListScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';

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
  const safeBadgeCount = Number.isFinite(badgeCount)
    ? Math.max(0, Math.floor(badgeCount))
    : 0;
  const badgeText = safeBadgeCount > 99 ? '99+' : String(safeBadgeCount);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={colors.primary}
      />
      {safeBadgeCount > 0 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{badgeText}</Text>
        </View>
      ) : showDot ? (
        <View style={styles.dot} />
      ) : null}
    </Pressable>
  );
}

export default function DashboardStack() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const authUser = useAuthStore((s) => s.user);
  const { data, refetch } = useNotificationsUnreadCount(isLoggedIn);
  const unreadCount = data?.unread_count ?? 0;
  const avatarUri =
    typeof authUser?.profile_picture === 'string' &&
    authUser.profile_picture.trim().length > 0
      ? authUser.profile_picture.trim()
      : null;
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUri]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) return;
      void refetch();
    }, [isLoggedIn, refetch])
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
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
                showDot
                onPress={() =>
                  Alert.alert('Notifications', 'Coming soon')
                }
              />
              <HeaderIconButton
                icon="chatbubble-ellipses-outline"
                badgeCount={unreadCount}
                onPress={() => navigation.navigate('MessagesList')}
              />
            </View>
          ),
          headerRight: () => (
            <Pressable
              style={styles.profileButton}
              onPress={() => {
                const parentNav = navigation.getParent() as any;
                parentNav?.navigate('More');
              }}
            >
              <View style={styles.avatar}>
                {avatarUri && !avatarLoadFailed ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={18}
                    color={colors.primary}
                  />
                )}
              </View>
            </Pressable>
          ),
        })}
      />

      <Stack.Screen
        name="MessagesList"
        component={MessagesListScreen}
        options={{
          title: 'Messages',
        }}
      />

      <Stack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GroupDetails"
        component={require('../screens/chat/GroupDetailsScreen').default}
        options={{
          title: 'Group Info',
          headerTitleAlign: 'center',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    position: 'relative',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
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
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  countBadgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '800',
  },
  profileButton: {
    paddingRight: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  heroCard: {
    borderRadius: 24,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  heroValue: {
    fontSize: 28,
    marginVertical: spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  heroActions: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  heroButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
  heroButtonInactive: {
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  heroButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    padding: spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
  },
  activityCard: {
    padding: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
});
