import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';

export default function StudentFinancialTab({ student }: { student: any }) {
  const financial = student.dashboard_data?.financial_summary ?? {};
  const enrollments: any[] = student.enrollments ?? [];

  const totalPaid = financial.total_fees_paid ?? 0;
  const totalPending = financial.total_fees_pending ?? 0;
  const totalFees = totalPaid + totalPending;

  const paidPercent = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

  const formatCurrency = (val: number) =>
    `₹${Number(val).toLocaleString('en-IN')}`;

  const StatCard = ({
    icon,
    label,
    value,
    accent,
    bg,
  }: {
    icon: any;
    label: string;
    value: string;
    accent: string;
    bg: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIconBox, { backgroundColor: accent + '25' }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <AppText variant="caption" color={accent} style={styles.statLabel}>
        {label}
      </AppText>
      <AppText style={[styles.statValue, { color: accent }]}>{value}</AppText>
    </View>
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="wallet-outline"
          label="Total Paid"
          value={formatCurrency(totalPaid)}
          accent={colors.successStrong}
          bg={colors.successBg}
        />
        <StatCard
          icon="alert-circle-outline"
          label="Pending"
          value={formatCurrency(totalPending)}
          accent={colors.dangerStrong}
          bg={colors.dangerBg}
        />
      </View>

      {/* Progress Bar */}
      <AppCard style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <AppText variant="subtitle" style={styles.progressTitle}>
            Payment Progress
          </AppText>
          <AppText
            variant="caption"
            color={colors.primary}
            style={{ fontWeight: '700' }}
          >
            {Math.round(paidPercent)}%
          </AppText>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(paidPercent, 100)}%` },
            ]}
          />
        </View>
        <View style={styles.progressLegend}>
          <AppText variant="caption" color={colors.textMuted}>
            {formatCurrency(totalPaid)} paid
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {formatCurrency(totalFees)} total
          </AppText>
        </View>
      </AppCard>

      {/* Per-Enrollment Breakdown */}
      {enrollments.length > 0 && (
        <View style={styles.breakdownSection}>
          <AppText variant="h3" style={styles.sectionTitle}>
            Enrollment Breakdown
          </AppText>
          {enrollments.map((e: any, idx: number) => {
            const feePaid = Number(e.total_amount_paid) || 0;
            const feePending = Number(e.total_pending_amount) || 0;
            const originalCourseFees = Number(e.original_course_fees) || 0;
            const admissionFees = Number(e.original_admission_fees) || 0;
            const totalDiscount = Number(e.total_discount_amount) || 0;
            const totalFeesAfterDiscount = originalCourseFees - totalDiscount;
            
            const pct = totalFeesAfterDiscount > 0 ? (feePaid / totalFeesAfterDiscount) * 100 : 0;

            return (
              <AppCard key={e.uid} style={styles.enrollCard}>
                <View style={styles.enrollHeader}>
                  <View style={styles.enrollIconBox}>
                    <Ionicons name="book" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.enrollCourseName}>
                      {e.batch?.course_name || 'Unknown Course'}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {e.batch?.batch_name || 'No Batch'}
                    </AppText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: e.status_object?.color + '15' }]}>
                    <AppText variant="caption" style={{ color: e.status_object?.color, fontWeight: '700' }}>
                      {e.status_object?.name || 'Status'}
                    </AppText>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailGrid}>
                  <View style={styles.detailRow}>
                    <AppText variant="caption" color={colors.textMuted}>Original Course Fees</AppText>
                    <AppText variant="body" style={{ fontWeight: '600' }}>{formatCurrency(originalCourseFees)}</AppText>
                  </View>
                  <View style={styles.detailRow}>
                    <AppText variant="caption" color={colors.textMuted}>Admission Fee</AppText>
                    <AppText variant="body" style={{ fontWeight: '600' }}>{formatCurrency(admissionFees)}</AppText>
                  </View>
                  <View style={styles.detailRow}>
                    <AppText variant="caption" color={colors.textMuted}>Total Discounts</AppText>
                    <AppText variant="body" color={colors.danger} style={{ fontWeight: '600' }}>- {formatCurrency(totalDiscount)}</AppText>
                  </View>
                  <View style={[styles.detailRow, styles.subtotalRow]}>
                    <AppText variant="caption" style={{ fontWeight: '700' }}>Fees after Discount</AppText>
                    <AppText variant="body" style={{ fontWeight: '700' }}>{formatCurrency(totalFeesAfterDiscount)}</AppText>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.paymentStatusRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.statusLine}>
                      <AppText variant="caption" color={colors.textMuted}>Paid Amount</AppText>
                      <AppText variant="body" color={colors.successStrong} style={{ fontWeight: '800' }}>{formatCurrency(feePaid)}</AppText>
                    </View>
                    <View style={styles.progressTrackSmall}>
                      <View style={[styles.progressFillSmall, { width: `${Math.min(pct, 100)}%` }]} />
                    </View>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <AppText variant="caption" color={colors.textMuted}>Remaining Balance</AppText>
                    <AppText variant="h3" color={colors.dangerStrong} style={{ fontWeight: '800' }}>{formatCurrency(feePending)}</AppText>
                  </View>
                </View>
              </AppCard>
            );
          })}
        </View>
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
    flexGrow: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 18,
    gap: 4,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontWeight: '600',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontWeight: '800',
    fontSize: 20,
  },
  progressCard: {
    padding: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceSubtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  breakdownSection: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  enrollCard: {
    padding: spacing.md,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  enrollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  enrollIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enrollCourseName: {
    fontWeight: '800',
    fontSize: 14,
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
    opacity: 0.3,
  },
  detailGrid: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    borderStyle: 'dashed',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statusLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTrackSmall: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceSubtle,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.successStrong,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.divider,
    opacity: 0.3,
  },
});
