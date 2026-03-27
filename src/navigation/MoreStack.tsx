import { colors } from '@/src/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreListScreen from '../screens/more/MoreListScreen';

const Stack = createNativeStackNavigator();

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
        options={{ title: 'Profile & Settings' }}
      />
    </Stack.Navigator>
  );
}
