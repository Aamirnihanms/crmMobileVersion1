import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function StudentsListScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Students List</Text>
    </View>
  );
}

export default function StudentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StudentsList" component={StudentsListScreen} />
    </Stack.Navigator>
  );
}
