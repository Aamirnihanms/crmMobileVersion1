import { View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import AppLoader from '../../components/common/AppLoader';
import { useLeadDetails } from '../../queries/leadDetails.query';
import type { LeadsStackParamList } from '../../navigation/LeadsStack';

import LeadHeader from '@/src/components/leads/LeadHeader';
import LeadDetailsTabs from '@/src/navigation/LeadDetailsTabs';

type LeadDetailsRouteProp =
  RouteProp<LeadsStackParamList, 'LeadDetails'>;

export default function LeadDetailsScreen() {
  const { params } = useRoute<LeadDetailsRouteProp>();
  const { id } = params;

  const { data, isLoading, isError } = useLeadDetails(id);

  if (isLoading) return <AppLoader />;
  if (isError || !data) return null;

  return (
    <View style={{ flex: 1 }}>
      <LeadHeader lead={data} />
      <LeadDetailsTabs leadId={id} />
    </View>
  );
}
