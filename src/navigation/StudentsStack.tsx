import { useAppTheme } from '@/src/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddDiscountScreen from '../screens/students/AddDiscountScreen';
import BatchChangeScreen from '../screens/students/BatchChangeScreen';
import ConvertedLeadHistoryScreen from '../screens/students/ConvertedLeadHistoryScreen';
import EditStudentScreen from '../screens/students/EditStudentScreen';
import EnrollmentDetailsScreen from '../screens/students/EnrollmentDetailsScreen';
import NewEnrollmentScreen from '../screens/students/NewEnrollmentScreen';
import SetPaymentModeScreen from '../screens/students/SetPaymentModeScreen';
import StudentDetailsScreen from '../screens/students/StudentDetailsScreen';
import StudentsListScreen from '../screens/students/StudentsListScreen';


const Stack = createNativeStackNavigator();

export type StudentsStackParamList = {
  StudentsList: undefined;
  StudentDetails: { id: string; is_active?: boolean };
  EnrollmentDetails: { id: string; studentId: string };
  EditStudent: { id: string };
  SetPaymentMode: { enrollmentId: string };
  AddDiscount: { enrollmentId: string; studentId: string };
  BatchChange: { enrollmentId: string; studentId: string };
  NewEnrollment: { studentId: string; studentName?: string };
  RejoinStudent: { student: any };
  ConvertedLeadHistory: { leadId: string };
};


export default function StudentsStack() {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTransparent: false,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="StudentsList"
        component={StudentsListScreen}
        options={{ title: 'Students' }}
      />
      <Stack.Screen
        name="StudentDetails"
        component={StudentDetailsScreen}
        options={{ title: 'Student Profile' }}
      />
      <Stack.Screen
        name="EnrollmentDetails"
        component={EnrollmentDetailsScreen}
        options={{ title: 'Enrollment' }}
      />
      <Stack.Screen
        name="EditStudent"
        component={EditStudentScreen}
        options={{ title: 'Edit Student' }}
      />
      <Stack.Screen
        name="SetPaymentMode"
        component={SetPaymentModeScreen}
        options={{ title: 'Set Payment Mode' }}
      />
      <Stack.Screen
        name="AddDiscount"
        component={AddDiscountScreen}
        options={{ title: 'Add Discount' }}
      />
      <Stack.Screen
        name="BatchChange"
        component={BatchChangeScreen}
        options={{ title: 'Batch Change Request' }}
      />
      <Stack.Screen
        name="NewEnrollment"
        component={NewEnrollmentScreen}
        options={{ title: 'New Enrollment' }}
      />
      <Stack.Screen
        name="RejoinStudent"
        getComponent={() => require('../screens/more/RejoinStudentScreen').default}
        options={{ title: 'Rejoin Student' }}
      />
      <Stack.Screen
        name="ConvertedLeadHistory"
        component={ConvertedLeadHistoryScreen}
        options={{ title: 'Lead History' }}
      />
    </Stack.Navigator>

  );
}
