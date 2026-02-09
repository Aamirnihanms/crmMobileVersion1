import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LeadsListScreen from '../screens/leads/LeadsListScreen';
import LeadDetailsScreen from '../screens/leads/LeadDetailsScreen';

export type LeadsStackParamList = {
  LeadsList: undefined;
  LeadDetails: { id: string };
};

const Stack = createNativeStackNavigator<LeadsStackParamList>();

export default function LeadsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LeadsList"
        component={LeadsListScreen}
        options={{ title: 'Leads' }}
      />
      <Stack.Screen
        name="LeadDetails"
        component={LeadDetailsScreen}
        options={{ title: 'Lead Details' }}
      />
    </Stack.Navigator>
  );
}
