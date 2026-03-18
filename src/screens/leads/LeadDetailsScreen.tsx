import { View } from 'react-native';
import { useState } from 'react';
import {
  RouteProp,
  useRoute,
  CommonActions,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppLoader from '../../components/common/AppLoader';
import { useLeadDetails } from '../../queries/leadDetails.query';
import type { LeadsStackParamList } from '../../navigation/LeadsStack';

import LeadHeader from '@/src/components/leads/LeadHeader';
import LeadDetailsTabs from '@/src/navigation/LeadDetailsTabs';

// ✅ IMPORT CONVERT MODAL
import ConvertLeadModalPro from '@/src/components/leads/modals/ConvertLeadModal';


import { useConvertLeadToStudent } from '@/src/queries/students.query';

type LeadDetailsRouteProp =
  RouteProp<LeadsStackParamList, 'LeadDetails'>;

type Nav = NativeStackNavigationProp<
  LeadsStackParamList,
  'LeadDetails'
>;


export default function LeadDetailsScreen() {
  const { params } = useRoute<LeadDetailsRouteProp>();
  const { id } = params;

  const { data, isLoading, isError } = useLeadDetails(id);

  const navigation = useNavigation<Nav>();

  const convertMutation = useConvertLeadToStudent();

  // ✅ Modal State
  const [openConvert, setOpenConvert] = useState(false);



const handleConvertSubmit = (payload: any) => {
  convertMutation.mutate(payload, {
    onSuccess: (data: any) => {
      setOpenConvert(false);

      const studentId = data?.data?.student?.student_id;
      if (!studentId) return;

      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            {
              name: 'Leads',
              state: {
                routes: [
                  {
                    name: 'LeadsList', // 👈 VERY IMPORTANT
                  },
                ],
              },
            },
            {
              name: 'Students',
              state: {
                routes: [
                  {
                    name: 'StudentDetails',
                    params: { id: studentId },
                  },
                ],
              },
            },
          ],
        })
      );
    },
  });
};

  if (isLoading) return <AppLoader />;
  if (isError || !data) return null;

  return (
    <View style={{ flex: 1 }}>
      {/* ✅ PASS HANDLER INTO HEADER */}
      <LeadHeader
        lead={data}
        onConvertPress={() => setOpenConvert(true)}
        onEditPress={
          data.is_editable
            ? () => navigation.navigate('CreateLead', { id })
            : undefined
        }
      />

      <LeadDetailsTabs leadId={id} />

      {/* ✅ CONVERT MODAL */}
      <ConvertLeadModalPro
        visible={openConvert}
        onClose={() => setOpenConvert(false)}
        lead={data}
        onSubmit={handleConvertSubmit}
        loading={convertMutation.isPending}
      />
    </View>
  );
}
