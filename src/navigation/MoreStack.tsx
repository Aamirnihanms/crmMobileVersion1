import { colors } from '@/src/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EditProfileScreen from '../screens/more/EditProfileScreen';
import BatchListScreen from '../screens/more/BatchListScreen';
import MoreListScreen from '../screens/more/MoreListScreen';
import ProfileScreen from '../screens/more/ProfileScreen';
import ChangePasswordScreen from '../screens/more/ChangePasswordScreen';
import BatchCreateScreen from '../screens/more/BatchCreateScreen';


import StudentDetailsScreen from '../screens/students/StudentDetailsScreen';
import EnrollmentDetailsScreen from '../screens/students/EnrollmentDetailsScreen';

export type MoreStackParamList = {
  MoreList: undefined;
  Profile: undefined;
  EditProfile: { user: any };
  BatchList: undefined;
  BatchDetail: { uid: string };
  ChangePassword: undefined;
  StudentDetails: { id: string };
  EnrollmentDetails: { id: string };
  BatchChangeRequestList: undefined;
  BatchChangeRequestDetail: { uid: string };
  BatchCreate: undefined;
  BatchEdit: { uid: string };
};


const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTransparent: false,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="MoreList"
        component={MoreListScreen}
        options={{ title: 'Account & Settings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="BatchList"
        component={BatchListScreen}
        options={{ title: 'Batches' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Stack.Screen
        name="BatchDetail"
        getComponent={() => require('../screens/more/BatchDetailScreen').default}
        options={{ title: 'Batch Details' }}
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
        name="BatchChangeRequestList"
        getComponent={() => require('../screens/more/BatchChangeRequestListScreen').default}
        options={{ title: 'Batch Change Requests' }}
      />
      <Stack.Screen
        name="BatchChangeRequestDetail"
        getComponent={() => require('../screens/more/BatchChangeRequestDetailScreen').default}
        options={{ title: 'Batch Change Detail' }}
      />
      <Stack.Screen
        name="BatchCreate"
        component={BatchCreateScreen}
        options={{ title: 'Create Batch' }}
      />
      <Stack.Screen
        name="BatchEdit"
        getComponent={() => require('../screens/more/BatchEditScreen').default}
        options={{ title: 'Edit Batch' }}
      />
    </Stack.Navigator>

  );
}
