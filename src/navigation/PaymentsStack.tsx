import { colors } from '@/src/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PaymentDetailsScreen from '../screens/payments/PaymentDetailsScreen';
import PaymentsListScreen from '../screens/payments/PaymentsListScreen';

export type PaymentsStackParamList = {
  PaymentsList: undefined;
  PaymentDetails: { uid: string };
};

const Stack = createNativeStackNavigator<PaymentsStackParamList>();

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
      <Stack.Screen
        name="PaymentDetails"
        component={PaymentDetailsScreen}
        options={{ title: 'Transaction Details' }}
      />
    </Stack.Navigator>
  );
}
