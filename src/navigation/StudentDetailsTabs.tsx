import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAppTheme } from '@/src/theme';

import StudentOverviewTab from '../screens/students/tabs/StudentOverviewTab';
import StudentEnrollmentsTab from '../screens/students/tabs/StudentEnrollmentsTab';
import StudentFinancialTab from '../screens/students/tabs/StudentFinancialTab';
import StudentActivityTab from '../screens/students/tabs/StudentActivityTab';

const Tab = createMaterialTopTabNavigator();

export default function StudentDetailsTabs({ student }: { student: any }) {
  const { colors } = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: false,
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 2.5,
          borderRadius: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'none',
          letterSpacing: 0,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
          height: 42,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          paddingVertical: 0,
          height: 42,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarPressColor: colors.primary + '12',
        lazy: true,
      }}
    >
      <Tab.Screen name="Overview">
        {() => <StudentOverviewTab student={student} />}
      </Tab.Screen>

      <Tab.Screen name="Enrollments">
        {() => <StudentEnrollmentsTab student={student} />}
      </Tab.Screen>

      <Tab.Screen name="Financial">
        {() => <StudentFinancialTab student={student} />}
      </Tab.Screen>

      <Tab.Screen name="Activity">
        {() => <StudentActivityTab studentId={student?.student_id} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
