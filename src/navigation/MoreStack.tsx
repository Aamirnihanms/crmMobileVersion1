import { colors } from '@/src/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EditProfileScreen from '../screens/more/EditProfileScreen';
import MoreListScreen from '../screens/more/MoreListScreen';
import ProfileScreen from '../screens/more/ProfileScreen';

export type MoreStackParamList = {
  MoreList: undefined;
  Profile: undefined;
  EditProfile: { user: any };
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
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
    </Stack.Navigator>
  );
}
