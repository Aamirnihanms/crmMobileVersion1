import { View, StyleSheet } from 'react-native';
import AppText from '@/src/components/common/AppText';
import { spacing } from '@/src/theme';

export default function StudentOverviewSection({ dashboard }: any) {
  const personal = dashboard.personal_info;
  const financial = dashboard.financial_summary;

  return (
    <View style={styles.card}>
      <AppText variant="subtitle">Overview</AppText>

      <AppText>📧 {personal.email}</AppText>
      <AppText>📞 {personal.phone_number}</AppText>
      <AppText>📍 {personal.location}</AppText>

      <View style={{ marginTop: spacing.md }}>
        <AppText variant="subtitle">Financial</AppText>

        <AppText>
          Paid: ₹{financial.total_fees_paid}
        </AppText>

        <AppText>
          Pending: ₹{financial.total_fees_pending}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
});