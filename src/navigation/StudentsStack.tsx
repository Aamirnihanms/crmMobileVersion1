import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EnrollmentDetailsScreen from '../screens/students/EnrollmentDetailsScreen';
import StudentDetailsScreen from '../screens/students/StudentDetailsScreen';
import StudentsListScreen from '../screens/students/StudentsListScreen';

const Stack = createNativeStackNavigator();


export type StudentsStackParamList = {
  StudentsList: undefined;
  StudentDetails: { id: string };
  EnrollmentDetails: { id: string };
};

export default function StudentsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
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
    </Stack.Navigator>
  );
}
