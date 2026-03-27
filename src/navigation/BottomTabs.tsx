import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Platform } from 'react-native';
import DashboardStack from './DashboardStack';
import LeadsStack from './LeadsStack';
import MoreStack from './MoreStack';
import PaymentsStack from './PaymentsStack';
import StudentsStack from './StudentsStack';

const Tab = createBottomTabNavigator();

// Define the initial routes for each stack. If the focused route is NOT one of these, we hide the tab bar.
const INITIAL_ROUTES = ['DashboardHome', 'LeadsList', 'StudentsList', 'PaymentsList', 'MoreList'];

const baseTabBarStyle = {
  backgroundColor: colors.surface,
  borderTopWidth: 1,
  borderTopColor: colors.surfaceSubtle,
  paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
  paddingTop: spacing.sm,
  height: Platform.OS === 'ios' ? 88 : 68,
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

// Helper function to get tabBarStyle based on current route
const getTabBarStyle = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route);

  // If routeName is undefined, it means we're at the initial route of the stack.
  // If it's defined, we check if it's one of our initial routes.
  const isTabBarVisible = !routeName || INITIAL_ROUTES.includes(routeName);

  return isTabBarVisible ? baseTabBarStyle : { display: 'none' as const };
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: getTabBarStyle(route),
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

