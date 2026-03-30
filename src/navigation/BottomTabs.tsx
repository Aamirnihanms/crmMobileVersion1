import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardStack from './DashboardStack';
import LeadsStack from './LeadsStack';
import MoreStack from './MoreStack';
import PaymentsStack from './PaymentsStack';
import StudentsStack from './StudentsStack';

const Tab = createBottomTabNavigator();

// Define the initial routes for each stack. If the focused route is NOT one of these, we hide the tab bar.
const INITIAL_ROUTES = ['DashboardHome', 'LeadsList', 'StudentsList', 'PaymentsList', 'MoreList'];
const ROUTES_WITH_OWN_BOTTOM_INSET = ['ChatThread', 'GroupDetails'];

const hiddenTabBarStyle = { display: 'none' as const };

const getBaseTabBarStyle = (bottomInset: number) => {
  const extraBottomPadding = Math.max(bottomInset, spacing.sm);
  const baseHeight = Platform.OS === 'ios' ? 56 : 60;

  return {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingBottom: extraBottomPadding,
    paddingTop: spacing.sm,
    height: baseHeight + extraBottomPadding,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  };
};

// Helper function to get tabBarStyle based on current route
const getTabBarStyle = (route: any, visibleStyle: ReturnType<typeof getBaseTabBarStyle>) => {
  const routeName = getFocusedRouteNameFromRoute(route);

  // If routeName is undefined, it means we're at the initial route of the stack.
  // If it's defined, we check if it's one of our initial routes.
  const isTabBarVisible = !routeName || INITIAL_ROUTES.includes(routeName);

  return isTabBarVisible ? visibleStyle : hiddenTabBarStyle;
};

const getSceneStyle = (route: any, bottomInset: number) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const isTabBarVisible = !routeName || INITIAL_ROUTES.includes(routeName);
  const managesBottomInsetItself = !!routeName && ROUTES_WITH_OWN_BOTTOM_INSET.includes(routeName);

  if (isTabBarVisible || managesBottomInsetItself) {
    return undefined;
  }

  return {
    paddingBottom: bottomInset,
  };
};

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const baseTabBarStyle = getBaseTabBarStyle(insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: getTabBarStyle(route, baseTabBarStyle),
        sceneStyle: getSceneStyle(route, insets.bottom),
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: Platform.OS === 'ios' ? 0 : spacing.xs,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        tabBarIconStyle: {
          marginTop: spacing.xs,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Leads"
        component={LeadsStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person-add" : "person-add-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Students"
        component={StudentsStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "school" : "school-outline"} size={23} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Payments"
        component={PaymentsStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "menu" : "menu-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
