import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import { useEnrollmentDetails } from '@/src/queries/enrollment.query';
import { colors, spacing } from '@/src/theme';

type RootParamList = {
  EnrollmentDetails: { id: string };
};

export default function EnrollmentDetailsScreen() {
  const { params } =
    useRoute<RouteProp<RootParamList, 'EnrollmentDetails'>>();

  const { data, isLoading, isError } =
    useEnrollmentDetails(params.id);

  if (isLoading) return <AppLoader />;

  if (isError || !data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText style={styles.errorText}>Error loading enrollment details</AppText>
      </View>
    );
  }

  const InfoRow = ({ icon, label, value, color = colors.textPrimary }: any) => (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoTextContainer}>
        <AppText variant="caption" color={colors.textMuted} style={styles.infoLabel}>{label}</AppText>
        <AppText style={[styles.infoValue, { color }]}>{value || 'N/A'}</AppText>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AppCard style={styles.headerCard}>
          <LinearGradient
            colors={[colors.primary, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <AppText variant="h2" color="#fff" style={styles.headerTitle}>
              {data.batch?.batch_name || 'General Enrollment'}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.8)">
              {data.batch?.course_name || 'No Course Specified'}
            </AppText>
          </LinearGradient>

          <View style={styles.headerBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: (data.status_object?.color || colors.primary) + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: data.status_object?.color || colors.primary }]} />
              <AppText variant="caption" style={{ color: data.status_object?.color || colors.primary, fontWeight: '700' }}>
                {data.status_object?.name || 'Active'}
              </AppText>
            </View>
            <View style={styles.idBadge}>
              <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '600' }}>
                #{data.enrollment_number}
              </AppText>
            </View>
          </View>
        </AppCard>

        <AppText variant="h3" style={styles.sectionTitle}>Course & Student</AppText>
        <AppCard style={styles.detailsCard}>
          <InfoRow icon="school-outline" label="Course" value={data.batch?.course_name} />
          <InfoRow icon="person-outline" label="Student Name" value={data.student_name} />
          <InfoRow icon="mail-outline" label="Email Address" value={data.student_email} />
          <InfoRow icon="call-outline" label="Phone Number" value={data.student_phone} />
        </AppCard>

        <AppText variant="h3" style={styles.sectionTitle}>Financial Summary</AppText>
        <AppCard style={styles.financialCard}>
          <View style={styles.feeGrid}>
            <View style={styles.feeItem}>
              <AppText variant="caption" color={colors.textMuted}>Net Fees</AppText>
              <AppText variant="h3">₹{data.net_fees}</AppText>
            </View>
            <View style={styles.feeItem}>
              <AppText variant="caption" color={colors.textMuted}>Payment Mode</AppText>
              <AppText variant="h3" style={{ fontSize: 14 }}>{data.payment_type_display}</AppText>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <AppText variant="caption" style={{ fontWeight: '700' }}>Collection Progress</AppText>
              <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>
                {Number(data.net_fees) > 0 ? Math.round((Number(data.total_amount_paid) / Number(data.net_fees)) * 100) : 0}%
              </AppText>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Number(data.net_fees) > 0 ? (Number(data.total_amount_paid) / Number(data.net_fees)) * 100 : 0}%` }
                ]}
              />
            </View>
          </View>

          <View style={styles.financialStats}>
            <View style={[styles.fStat, { backgroundColor: '#F0FDF4' }]}>
              <AppText variant="caption" color="#16A34A" style={{ fontWeight: '700' }}>Paid</AppText>
              <AppText variant="subtitle" style={{ color: '#16A34A', fontWeight: '800' }}>₹{data.total_amount_paid}</AppText>
            </View>
            <View style={[styles.fStat, { backgroundColor: '#FEF2F2' }]}>
              <AppText variant="caption" color="#DC2626" style={{ fontWeight: '700' }}>Remaining</AppText>
              <AppText variant="subtitle" style={{ color: '#DC2626', fontWeight: '800' }}>₹{data.total_pending_amount}</AppText>
            </View>
          </View>
        </AppCard>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  container: {
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.danger,
    textAlign: 'center',
  },
  headerCard: {
    padding: 0,
    borderRadius: 24,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  gradientHeader: {
    padding: spacing.xl,
    paddingBottom: spacing.xl * 1.5,
  },
  headerTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  headerBadgeContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    marginTop: -spacing.lg,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  idBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  detailsCard: {
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  financialCard: {
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoValue: {
    fontWeight: '600',
    fontSize: 15,
  },
  feeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  feeItem: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  financialStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    gap: 2,
  },
});