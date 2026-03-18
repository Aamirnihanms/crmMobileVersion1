import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import DashboardStack from './DashboardStack';
import LeadsStack from './LeadsStack';
import StudentsStack from './StudentsStack';
import PaymentsStack from './PaymentsStack';
import MoreStack from './MoreStack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme'; // Import from your theme index

const Tab = createBottomTabNavigator();
const HIDE_TAB_ROUTES = ['MessagesList', 'ChatThread'];

const baseTabBarStyle = {
  backgroundColor: colors.background,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  paddingBottom: spacing.sm,
  paddingTop: spacing.sm,
  height: 60,
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Using your theme colors
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: baseTabBarStyle,
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: typography.caption.fontWeight,
        },
        tabBarIconStyle: {
          marginBottom: -spacing.xs,
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-add-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="Students" 
        component={StudentsStack} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="Payments" 
        component={PaymentsStack} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="More" 
        component={MoreStack} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
