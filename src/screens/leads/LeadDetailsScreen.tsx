import {
  CommonActions,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import AppLoader from '../../components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import type { LeadsStackParamList } from '../../navigation/LeadsStack';
import { useLeadDetails } from '../../queries/leadDetails.query';

import LeadHeader from '@/src/components/leads/LeadHeader';
import LeadDetailsTabs from '@/src/navigation/LeadDetailsTabs';

// ✅ IMPORT CONVERT MODAL
import ConvertLeadModalPro from '@/src/components/leads/modals/ConvertLeadModal';


import { useConvertLeadToStudent } from '@/src/queries/students.query';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/src/theme';

type LeadDetailsRouteProp =
  RouteProp<LeadsStackParamList, 'LeadDetails'>;

type Nav = NativeStackNavigationProp<
  LeadsStackParamList,
  'LeadDetails'
>;


export default function LeadDetailsScreen() {
  const { params } = useRoute<LeadDetailsRouteProp>();
  const { id } = params;

  const { data, isLoading, isError, error, refetch } = useLeadDetails(id);

  const navigation = useNavigation<Nav>();

  const convertMutation = useConvertLeadToStudent();

  // ✅ Modal State
  const [openConvert, setOpenConvert] = useState(false);



  const handleConvertSubmit = (payload: any) => {
    convertMutation.mutate(payload, {
      onSuccess: (data: any) => {
        setOpenConvert(false);

        const student = data?.data?.student;
        const studentId =
          student?.uid || student?.student_id || student?.id;

        if (!studentId) return;

        // Reset root to Students stack with list->details history so back button appears.
        const parentNavigation = navigation.getParent<any>();
        if (parentNavigation) {
          parentNavigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Students',
                  state: {
                    index: 1,
                    routes: [
                      { name: 'StudentsList' },
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
        }
      },
    });
  };

  if (isLoading) return <AppLoader />;

  if (isError) {
    const errorDetail = (error as any)?.response?.data?.detail;
    const errorMessage = (error as any)?.response?.data?.error;
    const fallbackMessage = (error as Error)?.message || 'Failed to load lead details';
    
    // Display detail if available, otherwise specific error, otherwise generic message
    const displayMessage = errorDetail || errorMessage || fallbackMessage;

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={{ marginTop: spacing.md, textAlign: 'center', fontWeight: '600' }}>
          {displayMessage}
        </AppText>
        <Pressable onPress={() => refetch()} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12, backgroundColor: colors.primaryLight + '15' }}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

  if (!data) return null;

  const canConvertToAdmission =
    data.lead_status_details?.value === 'proceed_to_admission';

  return (
    <View style={{ flex: 1 }}>
      {/* ✅ PASS HANDLER INTO HEADER */}
      <LeadHeader
        lead={data}
        onConvertPress={
          canConvertToAdmission
            ? () => setOpenConvert(true)
            : undefined
        }
        onEditPress={
          data.is_editable
            ? () => navigation.navigate('CreateLead', { id })
            : undefined
        }
      />

      <LeadDetailsTabs leadId={id} />

      {/* ✅ CONVERT MODAL */}
      {openConvert ? (
        <ConvertLeadModalPro
          visible={openConvert}
          onClose={() => {
            setOpenConvert(false);
            convertMutation.reset();
          }}
          lead={data}
          onSubmit={handleConvertSubmit}
          loading={convertMutation.isPending}
          error={convertMutation.error}
        />
      ) : null}
    </View>
  );
}
