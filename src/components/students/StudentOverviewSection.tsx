import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

const InfoItem = ({ icon, label, value, color = colors.textPrimary }: any) => {
  const safeValue =
    typeof value === 'string'
      ? value.trim() || 'N/A'
      : value !== null && value !== undefined
      ? String(value)
      : 'N/A';

  return (
    <View style={styles.infoItem}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <AppText
          variant="caption"
          color={colors.textMuted}
          style={styles.infoLabel}
        >
          {label}
        </AppText>
        <AppText style={[styles.infoValue, { color }]}>
          {safeValue}
        </AppText>
      </View>
    </View>
  );
};

export default function StudentOverviewSection({ student }: any) {
  const personal = student.dashboard_data?.personal_info ?? {};
  const academic = student.dashboard_data?.academic_info ?? {};
  const financial = student.dashboard_data?.financial_summary ?? {};
  const counselor = student.dashboard_data?.counselor_info ?? {};

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const boolLabel = (val: boolean | null | undefined) => {
    if (val === null || val === undefined) return null;
    return val ? 'Yes' : 'No';
  };

  // 🔥 helper to avoid empty string issues
  const hasText = (val: any) =>
    typeof val === 'string'
      ? val.trim().length > 0
      : val !== null && val !== undefined;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Profile Overview
        </AppText>
      </View>

      {/* Personal Information */}
      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.cardHeader}>
          Personal Information
        </AppText>
        <View style={styles.grid}>
          <InfoItem icon="mail-outline" label="Email Address" value={personal.email} />
          <InfoItem icon="call-outline" label="Mobile Number" value={personal.phone_number} />
          <InfoItem icon="logo-whatsapp" label="WhatsApp Number" value={personal.whatsapp_number} />
          <InfoItem icon="location-outline" label="Preferred Location" value={personal.location} />

          {hasText(personal.address) && (
            <InfoItem icon="home-outline" label="Address" value={personal.address} />
          )}
          {hasText(personal.district) && (
            <InfoItem icon="map-outline" label="District" value={personal.district} />
          )}
          {hasText(personal.pincode) && (
            <InfoItem icon="pin-outline" label="Pincode" value={personal.pincode} />
          )}

          {personal.age !== null && personal.age !== undefined && (
            <InfoItem icon="person-outline" label="Age" value={`${personal.age} years`} />
          )}

          {hasText(student.date_of_birth) && (
            <InfoItem
              icon="calendar-outline"
              label="Date of Birth"
              value={formatDate(student.date_of_birth)}
            />
          )}

          {hasText(student.parent_name) && (
            <InfoItem icon="people-outline" label="Parent Name" value={student.parent_name} />
          )}
          {hasText(student.parent_phone_number) && (
            <InfoItem icon="call-outline" label="Parent Phone" value={student.parent_phone_number} />
          )}
        </View>
      </AppCard>

      {/* Education Background */}
      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.cardHeader}>
          Education Background
        </AppText>
        <View style={styles.grid}>
          {hasText(academic.qualification) && (
            <InfoItem icon="school-outline" label="Qualification" value={academic.qualification} />
          )}
          {hasText(academic.college) && (
            <InfoItem icon="library-outline" label="College" value={academic.college} />
          )}
          {hasText(academic.specialization) && (
            <InfoItem icon="book-outline" label="Specialization" value={academic.specialization} />
          )}
          {academic.pass_out_year !== null && academic.pass_out_year !== undefined && (
            <InfoItem
              icon="calendar-outline"
              label="Pass Out Year"
              value={String(academic.pass_out_year)}
            />
          )}
          {academic.cgpa !== null && academic.cgpa !== undefined && (
            <InfoItem icon="stats-chart-outline" label="CGPA" value={String(academic.cgpa)} />
          )}

          <InfoItem
            icon={academic.any_arrears ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            label="Arrears"
            value={boolLabel(academic.any_arrears)}
            color={academic.any_arrears ? colors.dangerStrong : colors.successStrong}
          />

          {hasText(academic.admission_date) && (
            <InfoItem
              icon="enter-outline"
              label="Admission Date"
              value={formatDate(academic.admission_date)}
            />
          )}
        </View>
      </AppCard>

      {/* Additional Info */}
      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.cardHeader}>
          Additional Information
        </AppText>
        <View style={styles.grid}>
          {hasText(student.lead_source?.source_name) && (
            <InfoItem
              icon="git-branch-outline"
              label="Lead Source"
              value={student.lead_source.source_name}
            />
          )}
          {hasText(student.how_did_you_hear) && (
            <InfoItem
              icon="ear-outline"
              label="How Did You Hear"
              value={student.how_did_you_hear}
            />
          )}

          <InfoItem
            icon="ribbon-outline"
            label="Placement Assistance"
            value={boolLabel(student.placement_assistance)}
            color={
              student.placement_assistance
                ? colors.successStrong
                : colors.textPrimary
            }
          />

          {hasText(student.preferred_job_location) && (
            <InfoItem
              icon="briefcase-outline"
              label="Preferred Job Location"
              value={student.preferred_job_location}
            />
          )}
          {hasText(student.student_or_working_professional) && (
            <InfoItem
              icon="person-add-outline"
              label="Profile Type"
              value={student.student_or_working_professional}
            />
          )}
          {hasText(counselor.name) && (
            <InfoItem
              icon="people-circle-outline"
              label="Admission Counselor"
              value={counselor.name}
            />
          )}
        </View>
      </AppCard>

      {/* Financial Summary */}
      <AppCard style={styles.card}>
        <AppText variant="subtitle" style={styles.cardHeader}>
          Financial Summary
        </AppText>
        <View style={styles.financialGrid}>
          <View style={[styles.financialCard, { backgroundColor: colors.successBg }]}>
            <View style={[styles.financialIcon, { backgroundColor: colors.successBgSoft }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.successStrong} />
            </View>
            <AppText variant="caption" color={colors.successStrong} style={{ fontWeight: '600' }}>
              Paid Fees
            </AppText>
            <AppText variant="h3" style={{ color: colors.successStrong, fontWeight: '800' }}>
              ₹{String(financial.total_fees_paid ?? 0)}
            </AppText>
          </View>

          <View style={[styles.financialCard, { backgroundColor: colors.dangerBg }]}>
            <View style={[styles.financialIcon, { backgroundColor: colors.dangerBgSoft }]}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.dangerStrong} />
            </View>
            <AppText variant="caption" color={colors.dangerStrong} style={{ fontWeight: '600' }}>
              Pending
            </AppText>
            <AppText variant="h3" style={{ color: colors.dangerStrong, fontWeight: '800' }}>
              ₹{String(financial.total_fees_pending ?? 0)}
            </AppText>
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