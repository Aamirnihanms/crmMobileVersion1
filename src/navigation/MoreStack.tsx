import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function MoreListScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>More List</Text>
    </View>
  );
}

export default function MoreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MoreList" component={MoreListScreen} />
    </Stack.Navigator>
  );
}
