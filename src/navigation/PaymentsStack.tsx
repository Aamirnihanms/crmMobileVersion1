import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function PaymentsListScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Payments List</Text>
    </View>
  );
}

export default function PaymentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PaymentsList" component={PaymentsListScreen} />
    </Stack.Navigator>
  );
}
