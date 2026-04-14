import { colors } from '@/src/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EditProfileScreen from '../screens/more/EditProfileScreen';
import BatchListScreen from '../screens/more/BatchListScreen';
import MoreListScreen from '../screens/more/MoreListScreen';
import ProfileScreen from '../screens/more/ProfileScreen';
import ChangePasswordScreen from '../screens/more/ChangePasswordScreen';

export type MoreStackParamList = {
  MoreList: undefined;
  Profile: undefined;
  EditProfile: { user: any };
  BatchList: undefined;
  ChangePassword: undefined;
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
    </Stack.Navigator>
  );
}
