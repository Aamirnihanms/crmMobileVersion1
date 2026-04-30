import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { colors } from '@/src/theme';

import ConvertedLeadDetailsTab from '../screens/students/convertedLeadTabs/ConvertedLeadDetailsTab';
import ConvertedLeadFollowUpsTab from '../screens/students/convertedLeadTabs/ConvertedLeadFollowUpsTab';
import ConvertedLeadNotesTab from '../screens/students/convertedLeadTabs/ConvertedLeadNotesTab';
import ConvertedLeadActivityTab from '../screens/students/convertedLeadTabs/ConvertedLeadActivityTab';

const Tab = createMaterialTopTabNavigator();

export default function ConvertedLeadDetailsTabs({ leadId }: { leadId: string }) {
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
      }}
    >
      <Tab.Screen name="Details">
        {() => <ConvertedLeadDetailsTab id={leadId} />}
      </Tab.Screen>

      <Tab.Screen name="Follow-ups">
        {() => <ConvertedLeadFollowUpsTab id={leadId} />}
      </Tab.Screen>

      <Tab.Screen name="Notes">
        {() => <ConvertedLeadNotesTab id={leadId} />}
      </Tab.Screen>

      <Tab.Screen name="Activity">
        {() => <ConvertedLeadActivityTab id={leadId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
