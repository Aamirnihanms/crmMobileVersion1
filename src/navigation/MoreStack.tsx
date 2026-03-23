import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreListScreen from '../screens/more/MoreListScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

export default function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: '#F8F9FE',
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
