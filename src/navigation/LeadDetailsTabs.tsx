import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAppTheme } from '@/src/theme';

import LeadActivityTab from '../screens/leads/tabs/LeadActivityTab';
import LeadDetailsTab from '../screens/leads/tabs/LeadDetailsTab';
import LeadFollowUpsTab from '../screens/leads/tabs/LeadFollowUpsTab';
import LeadNotesTab from '../screens/leads/tabs/LeadNotesTab';

const Tab = createMaterialTopTabNavigator();

export default function LeadDetailsTabs({ leadId }: { leadId: string }) {
  const { colors } = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Details">
        {() => <LeadDetailsTab id={leadId} />}
      </Tab.Screen>

      <Tab.Screen name="Follow-ups">
        {() => <LeadFollowUpsTab id={leadId} />}
      </Tab.Screen>

      <Tab.Screen name="Notes">
        {() => <LeadNotesTab id={leadId} />}
      </Tab.Screen>

      <Tab.Screen name="Activity">
        {() => <LeadActivityTab id={leadId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
