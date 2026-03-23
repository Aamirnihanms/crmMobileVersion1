import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

export default function StudentOverviewSection({ dashboard }: any) {
  const personal = dashboard.personal_info;
  const financial = dashboard.financial_summary;

  const InfoItem = ({ icon, label, value, color = colors.textPrimary }: any) => (
    <View style={styles.infoItem}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <AppText variant="caption" color={colors.textMuted} style={styles.infoLabel}>{label}</AppText>
        <AppText style={[styles.infoValue, { color }]}>{value || 'N/A'}</AppText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <AppText variant="h3" style={styles.sectionTitle}>Profile Overview</AppText>
      </View>

      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.cardHeader}>Contact Information</AppText>
        <View style={styles.grid}>
          <InfoItem icon="mail-outline" label="Email Address" value={personal.email} />
          <InfoItem icon="call-outline" label="Mobile Number" value={personal.phone_number} />
          <InfoItem icon="location-outline" label="Current City" value={personal.location} />
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.cardHeader}>Financial Summary</AppText>
        <View style={styles.financialGrid}>
          <View style={[styles.financialCard, { backgroundColor: '#F0FDF4' }]}>
            <View style={[styles.financialIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="wallet-outline" size={20} color="#16A34A" />
            </View>
            <AppText variant="caption" color="#16A34A" style={{ fontWeight: '600' }}>Paid Fees</AppText>
            <AppText variant="h3" style={{ color: '#16A34A', fontWeight: '800' }}>₹{financial.total_fees_paid}</AppText>
          </View>

          <View style={[styles.financialCard, { backgroundColor: '#FEF2F2' }]}>
            <View style={[styles.financialIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            </View>
            <AppText variant="caption" color="#DC2626" style={{ fontWeight: '600' }}>Pending</AppText>
            <AppText variant="h3" style={{ color: '#DC2626', fontWeight: '800' }}>₹{financial.total_fees_pending}</AppText>
          </View>
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardHeader: {
    marginBottom: spacing.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
  },
  grid: {
    gap: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
    fontWeight: '700',
  },
  infoValue: {
    fontWeight: '600',
    fontSize: 15,
  },
  financialGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  financialCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    gap: 4,
  },
  financialIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});