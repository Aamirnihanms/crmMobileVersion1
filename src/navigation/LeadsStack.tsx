import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreateLeadScreen from '../screens/leads/CreateLeadScreen';
import LeadDetailsScreen from '../screens/leads/LeadDetailsScreen';
import LeadsListScreen from '../screens/leads/LeadsListScreen';

import { colors } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

export type LeadsStackParamList = {
  LeadsList: undefined;
  LeadDetails: { id: string };
  CreateLead: { id?: string } | undefined;
};

const Stack = createNativeStackNavigator<LeadsStackParamList>();

export default function LeadsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
      }}
    >
      <Stack.Screen
        name="LeadsList"
        component={LeadsListScreen}
        options={({ navigation }) => ({
          title: 'Leads',
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('CreateLead')}
              style={{ padding: 4 }}
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
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
        options={({ route }) => ({
          title: route.params?.id ? 'Edit Lead' : 'New Lead',
        })}
      />
    </Stack.Navigator>
  );
}
