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

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
        <AppText variant="subtitle" style={styles.sectionTitle}>Guardian Info</AppText>
        <View style={styles.grid}>
          <InfoItem icon="person-circle-outline" label="Parent Name" value={data.parent_name} />
          <InfoItem icon="call-outline" label="Parent Phone" value={data.parent_phone_number} />
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.sectionTitle}>Academic Details</AppText>
        <View style={styles.grid}>
          <InfoItem 
            icon="school-outline" 
            label="Qualification" 
            value={data.qualification_details?.name || data.education_level_details?.name} 
          />
          <InfoItem icon="business-outline" label="College/Institution" value={data.college} />
          <InfoItem icon="calendar-outline" label="Pass Out Year" value={data.pass_out_year} />
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.sectionTitle}>Assignment & Meta</AppText>
        <View style={styles.grid}>
          <InfoItem
            icon="person-outline"
            label="Counselor"
            value={data.counselor_details?.full_name}
          />
          <InfoItem
            icon="share-social-outline"
            label="Source"
            value={data.lead_source_details?.label}
          />
          <InfoItem
            icon="time-outline"
            label="Created At"
            value={formatDate(data.created_at)}
          />
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.sectionTitle}>Course Interest</AppText>
        <View style={styles.grid}>
          <InfoItem
            icon="book-outline"
            label="Course"
            value={data.course_details?.course_name}
          />
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.sectionTitle}>Location & Address</AppText>
        <View style={styles.grid}>
          <InfoItem 
            icon="location-outline" 
            label="Preferred Location" 
            value={data.preferred_location_details?.name} 
          />
          <InfoItem icon="map-outline" label="City" value={data.city} />
          <InfoItem icon="home-outline" label="Address" value={data.address} />
        </View>
      </AppCard>
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
