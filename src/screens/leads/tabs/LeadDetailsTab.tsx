import { ScrollView, StyleSheet } from 'react-native';
import AppText from '../../../components/common/AppText';
import AppLoader from '../../../components/common/AppLoader';
import { spacing } from '../../../theme';
import { useLeadDetails } from '../../../queries/leadDetails.query';

export default function LeadDetailsTab({ id }: { id: string }) {
  const { data, isLoading } = useLeadDetails(id);


  if (isLoading || !data) return <AppLoader />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText variant="subtitle">Contact</AppText>
      <AppText>{data.phone_number}</AppText>
      {data.email && <AppText>{data.email}</AppText>}

      <AppText variant="subtitle" style={styles.section}>
        Counselor
      </AppText>
      <AppText>
        {data.counselor_details?.full_name ?? '—'}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
});
