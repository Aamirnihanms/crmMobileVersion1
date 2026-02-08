import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function LeadsListScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Leads List</Text>
    </View>
  );
}

export default function LeadsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LeadsList" component={LeadsListScreen} />
    </Stack.Navigator>
  );
}
