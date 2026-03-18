import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../components/common/AppText';
import { colors, spacing } from '../theme';

const Stack = createNativeStackNavigator();

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
    <Pressable style={styles.iconButton} onPress={onPress}>
      <Ionicons
        name={icon}
        size={20}
        color={colors.textPrimary}
      />
      {showDot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

function DashboardScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <AppText variant="title">Dashboard</AppText>
        <AppText color={colors.textSecondary} style={styles.heroSubtext}>
          Quick overview of leads, students, and recent activity.
        </AppText>
      </View>
    </View>
  );
}

export default function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{
          title: '',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
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
                onPress={() =>
                  Alert.alert('Messages', 'Coming soon')
                }
              />
            </View>
          ),
          headerRight: () => (
            <Pressable
              style={styles.profileButton}
              onPress={() => Alert.alert('Profile', 'Coming soon')}
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
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  profileButton: {
    paddingLeft: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F6F1FF',
  },
  heroCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  heroSubtext: {
    marginTop: spacing.xs,
  },
});
