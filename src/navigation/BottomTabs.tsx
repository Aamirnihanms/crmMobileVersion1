import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardStack from './DashboardStack';
import LeadsStack from './LeadsStack';
import StudentsStack from './StudentsStack';
import PaymentsStack from './PaymentsStack';
import MoreStack from './MoreStack';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Leads" component={LeadsStack} />
      <Tab.Screen name="Students" component={StudentsStack} />
      <Tab.Screen name="Payments" component={PaymentsStack} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}
