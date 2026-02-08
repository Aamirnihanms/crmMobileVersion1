import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function DashboardScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Dashboard</Text>
    </View>
  );
}

export default function DashboardStack() {
  return (
    <Stack.Navigator >
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
    </Stack.Navigator>
  );
}
