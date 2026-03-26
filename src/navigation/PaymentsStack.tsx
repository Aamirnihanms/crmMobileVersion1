import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PaymentsListScreen from '../screens/payments/PaymentsListScreen';
import { colors } from '@/src/theme';

const Stack = createNativeStackNavigator();

export default function PaymentsStack() {
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
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="PaymentsList"
        component={PaymentsListScreen}
        options={{ title: 'Financials' }}
      />
    </Stack.Navigator>
  );
}
