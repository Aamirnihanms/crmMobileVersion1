import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LeadsListScreen from '../screens/leads/LeadsListScreen';
import LeadDetailsScreen from '../screens/leads/LeadDetailsScreen';
import CreateLeadScreen from '../screens/leads/CreateLeadScreen';

import { Pressable } from 'react-native';
import AppText from '../components/common/AppText';
import { colors } from '../theme';

export type LeadsStackParamList = {
  LeadsList: undefined;
  LeadDetails: { id: string };
  CreateLead: undefined; // 👈 add this
  StudentDetails: { id: string }; // 👈 MUST EXIST

};

const Stack = createNativeStackNavigator<LeadsStackParamList>();

export default function LeadsStack() {
  return (
    <Stack.Navigator>
     <Stack.Screen
  name="LeadsList"
  component={LeadsListScreen}
  options={({ navigation }) => ({
    title: 'Leads',
    headerRight: () => (
      <Pressable
        onPress={() => navigation.navigate('CreateLead')}
        style={{ marginRight: 16 }}
      >
        <AppText color={colors.primary}>Add</AppText>
      </Pressable>
    ),
  })}
/>

      <Stack.Screen
        name="LeadDetails"
        component={LeadDetailsScreen}
        options={{ title: 'Lead Details' }}
      />
      <Stack.Screen
  name="CreateLead"
  component={CreateLeadScreen}
  options={{ title: 'Create Lead' }}
/>
    </Stack.Navigator>
  );
}
