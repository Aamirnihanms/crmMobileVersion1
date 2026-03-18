import { View, ScrollView, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import { useEnrollmentDetails } from '@/src/queries/enrollment.query';
import { spacing } from '@/src/theme';

type RootParamList = {
  EnrollmentDetails: { id: string };
};

export default function EnrollmentDetailsScreen() {
  const { params } =
    useRoute<RouteProp<RootParamList, 'EnrollmentDetails'>>();

  const { data, isLoading, isError } =
    useEnrollmentDetails(params.id);

  if (isLoading) return <AppLoader />;
  if (isError || !data) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText variant="title">
        {data.batch?.batch_name}
      </AppText>

      <AppText>
        Course: {data.batch?.course_name}
      </AppText>

      <AppText>
        Enrollment Number: {data.enrollment_number}
      </AppText>

      <AppText>
        Status: {data.status_object?.name}
      </AppText>

      <AppText>
        Total Paid: {data.total_amount_paid}
      </AppText>

      <AppText>
        Pending: {data.total_pending_amount}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
});