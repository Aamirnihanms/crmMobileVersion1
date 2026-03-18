import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import StudentsListScreen from '../screens/students/StudentsListScreen';
import StudentDetailsScreen from '../screens/students/StudentDetailsScreen';
import EnrollmentDetailsScreen from '../screens/students/EnrollmentDetailsScreen';

const Stack = createNativeStackNavigator();


export type StudentsStackParamList = {
  StudentsList: undefined;
  StudentDetails: { id: string };
  EnrollmentDetails: { id: string };
};

export default function StudentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StudentsList" component={StudentsListScreen} />
      <Stack.Screen
        name="StudentDetails"
        component={StudentDetailsScreen}
        options={{ title: 'Student Details' }}
      />
      <Stack.Screen
        name="EnrollmentDetails"
        component={EnrollmentDetailsScreen}
        options={{ title: 'Enrollment Details' }}
      />
    </Stack.Navigator>
  );
}
