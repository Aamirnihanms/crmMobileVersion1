import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { colors, spacing } from '@/src/theme';
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showDot?: boolean;
}) {
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
      {showDot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export default function DashboardStack() {
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
                <Ionicons
                  name="person"
                  size={18}
                  color={colors.primary}
                />
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
