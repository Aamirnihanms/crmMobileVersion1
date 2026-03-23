import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Platform } from 'react-native';
import { colors, spacing } from '../theme';
import DashboardStack from './DashboardStack';
import LeadsStack from './LeadsStack';
import MoreStack from './MoreStack';
import PaymentsStack from './PaymentsStack';
import StudentsStack from './StudentsStack';

const Tab = createBottomTabNavigator();
const HIDE_TAB_ROUTES = ['MessagesList', 'ChatThread'];

const baseTabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#F1F5F9',
  paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
  paddingTop: spacing.sm,
  height: Platform.OS === 'ios' ? 88 : 68,
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
    },
    android: {
      elevation: 10,
    },
  }),
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: baseTabBarStyle,
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
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={({ route }) => {
          const routeName =
            getFocusedRouteNameFromRoute(route) ?? 'DashboardHome';
          const hideTab = HIDE_TAB_ROUTES.includes(routeName);

          return {
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
            ),
            tabBarStyle: hideTab
              ? { display: 'none' }
              : baseTabBarStyle,
          };
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
