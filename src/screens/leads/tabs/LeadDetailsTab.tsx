import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import AppCard from '../../../components/common/AppCard';
import AppLoader from '../../../components/common/AppLoader';
import AppText from '../../../components/common/AppText';
import { useLeadDetails } from '../../../queries/leadDetails.query';
import { colors, spacing } from '@/src/theme';

export default function LeadDetailsTab({ id }: { id: string }) {
  const { data, isLoading } = useLeadDetails(id);

  if (isLoading || !data) return <AppLoader />;

  const InfoItem = ({ icon, label, value }: any) => (
    <View style={styles.infoItem}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color={colors.textMuted}>{label}</AppText>
        <AppText style={styles.infoValue}>{value || '—'}</AppText>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.sectionTitle}>Contact Info</AppText>
        <View style={styles.grid}>
          <InfoItem icon="call-outline" label="Phone" value={data.phone_number} />
          <InfoItem icon="logo-whatsapp" label="WhatsApp" value={data.whatsapp_number} />
          <InfoItem icon="mail-outline" label="Email" value={data.email} />
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.sectionTitle}>Assignment</AppText>
        <View style={styles.grid}>
          <InfoItem
            icon="person-outline"
            label="Counselor"
            value={data.counselor_details?.full_name}
          />
          <InfoItem
            icon="business-outline"
            label="Source"
            value={data.lead_source_details?.label}
          />
        </View>
      </AppCard>

      {data.course_details && (
        <AppCard style={styles.card}>
          <AppText variant="subtitle" style={styles.sectionTitle}>Course Interest</AppText>
          <InfoItem
            icon="book-outline"
            label="Course"
            value={data.course_details.course_name}
          />
        </AppCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  grid: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoValue: {
    fontWeight: '600',
    marginTop: 2,
    color: colors.textPrimary,
  },
  description: {
    lineHeight: 20,
  },
});
