import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppLoader from '@/src/components/common/AppLoader';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';

import { useInfiniteBatches } from '@/src/queries/batches.query';
import { useCounselors } from '@/src/queries/masters/counselors.query';
import { useCourses } from '@/src/queries/masters/courses.query';
import { useAddNewEnrollment } from '@/src/queries/students.query';

import { colors, spacing } from '@/src/theme';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';
import { Batch } from '@/src/api/batches.api';

/* ─── Constants ─── */

const ATTENDANCE_MODES = [
  { label: 'Online', value: '1' },
  { label: 'Offline', value: '2' },
  { label: 'Hybrid', value: '3' },
];

const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'UPI', value: 'upi' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Debit Card', value: 'debit_card' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Other', value: 'other' },
];

// ─── Seat availability helpers ────────────────────────────────────────────────

type SeatCheck = {
  /** true = seats are available for the chosen mode */
  available: boolean;
  /** human-readable status message */
  message: string;
  /** 'ok' | 'warn' | 'error' */
  severity: 'ok' | 'warn' | 'error';
};

function checkSeatAvailability(batch: Batch | null, modeId: string): SeatCheck | null {
  if (!batch || !modeId) return null;
  const sa = batch.seat_availability;
  if (!sa) return null;

  // Map attendanceModeId to string mode
  const modeMap: Record<string, string> = {
    '1': 'online',
    '2': 'offline',
    '3': 'hybrid',
  };
  const mode = modeMap[modeId];
  if (!mode) return null;

  const onlineAvail: number = sa.online?.available ?? 0;
  const offlineAvail: number = sa.offline?.available ?? 0;
  const canOnline: boolean = sa.can_enroll_online ?? onlineAvail > 0;
  const canOffline: boolean = sa.can_enroll_offline ?? offlineAvail > 0;

  if (mode === 'online') {
    if (!canOnline || onlineAvail === 0) {
      return {
        available: false,
        message: `No online seats available in this batch (Online: ${onlineAvail} left)`,
        severity: 'error',
      };
    }
    return {
      available: true,
      message: `${onlineAvail} online seat${onlineAvail === 1 ? '' : 's'} available`,
      severity: 'ok',
    };
  }

  if (mode === 'offline') {
    if (!canOffline || offlineAvail === 0) {
      return {
        available: false,
        message: `No offline seats available in this batch (Offline: ${offlineAvail} left)`,
        severity: 'error',
      };
    }
    return {
      available: true,
      message: `${offlineAvail} offline seat${offlineAvail === 1 ? '' : 's'} available`,
      severity: 'ok',
    };
  }

  if (mode === 'hybrid') {
    if (!canOffline || offlineAvail === 0) {
      return {
        available: false,
        message: `No offline seats available. Hybrid enrollment requires offline capacity.`,
        severity: 'error',
      };
    }
    if (!canOnline || onlineAvail === 0) {
      return {
        available: true,
        message: `Hybrid — Online seats full, Offline: ${offlineAvail} left`,
        severity: 'warn',
      };
    }
    return {
      available: true,
      message: `Online: ${onlineAvail} seats  ·  Offline: ${offlineAvail} seats available`,
      severity: 'ok',
    };
  }

  return null;
}

type Step = 'form' | 'options' | 'payment_link' | 'manual';

export default function NewEnrollmentScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<StudentsStackParamList, 'NewEnrollment'>>();
  const { studentId, studentName } = route.params;

  // Step state
  const [step, setStep] = useState<Step>('form');

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [attendanceModeId, setAttendanceModeId] = useState('');
  const [selectedCounselorUid, setSelectedCounselorUid] = useState('');

  // Manual enrollment state
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Data hooks
  const { data: courses, isLoading: isCoursesLoading } = useCourses();
  const { data: counselors, isLoading: isCounselorsLoading } = useCounselors();

  const { data: batchPages, isLoading: isBatchesLoading } = useInfiniteBatches('', {
    course_id: selectedCourseId || undefined,
  });

  const enrollMutation = useAddNewEnrollment();

  const isLoading = isCoursesLoading || isCounselorsLoading;

  if (isLoading) return <AppLoader />;

  // ── Derived data ──
  const courseOptions = (courses || []).map((c: any) => ({
    label: c.course_name,
    value: String(c.id),
  }));

  const allBatches = batchPages?.pages.flatMap((p) => p.batches) || [];

  const batchOptions = allBatches.map((b) => ({
    label: b.batch_name,
    value: b.uid,
  }));

  const counselorOptions = (counselors || []).map((c: any) => ({
    label: c.full_name,
    value: c.uid ?? c.id?.toString(),
  }));

  // The full batch object for the currently selected batch
  const selectedBatch = allBatches.find((b) => b.uid === selectedBatchId) ?? null;

  // Seat availability check
  const seatCheck = useMemo(
    () => checkSeatAvailability(selectedBatch, attendanceModeId),
    [selectedBatch, attendanceModeId]
  );

  // ── Validation ──
  const isFormValid = selectedCourseId && selectedBatchId && attendanceModeId && selectedCounselorUid;

  // ── Payment link (mock for now) ──
  const paymentLink = `https://pay.luminar.in/enroll/${studentId}/${selectedBatchId}`;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(paymentLink);
    Alert.alert('Copied!', 'Payment link copied to clipboard.');
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Complete your enrollment payment here: ${paymentLink}`,
      });
    } catch (err) {
      // user cancelled
    }
  };

  // ── Submit manual enrollment ──
  const handleManualSubmit = () => {
    if (!paymentMethod) {
      Alert.alert('Validation', 'Please select a payment method.');
      return;
    }
    if (!paymentReference.trim()) {
      Alert.alert('Validation', 'Please enter a payment reference.');
      return;
    }

    enrollMutation.mutate(
      {
        student_id: studentId,
        batch_id: selectedBatchId,
        attendance_mode_id: attendanceModeId,
        admission_counselor_id: selectedCounselorUid,
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim(),
        payment_type: 'not_set',
      },
      {
        onSuccess: (data) => {
          Alert.alert(
            'Success',
            data?.message || 'Enrollment created successfully.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.detail ||
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            JSON.stringify(error?.response?.data?.errors) ||
            'Failed to create enrollment.';
          Alert.alert('Error', msg);
        },
      }
    );
  };

  // ── Render ──
  return (
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      bottomOffset={80}
    >
      {/* ── Header Banner ── */}
      <AppCard style={styles.headerCard}>
        <LinearGradient
          colors={[colors.primary, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBanner}
        >
          <Ionicons name="school-outline" size={22} color="#fff" style={{ marginBottom: 6 }} />
          <AppText variant="h3" color="#fff" style={{ fontWeight: '800' }}>
            New Enrollment
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>
            {studentName ? `Enrolling ${studentName}` : `Student: ${studentId}`}
          </AppText>
        </LinearGradient>
      </AppCard>

      {/* ── Step indicators ── */}
      <View style={styles.stepsRow}>
        <StepIndicator
          number={1}
          label="Details"
          active={step === 'form'}
          done={step !== 'form'}
        />
        <View style={styles.stepLine} />
        <StepIndicator
          number={2}
          label="Admission"
          active={step === 'options' || step === 'payment_link' || step === 'manual'}
          done={step === 'payment_link' || step === 'manual'}
        />
        <View style={styles.stepLine} />
        <StepIndicator
          number={3}
          label="Complete"
          active={step === 'payment_link' || step === 'manual'}
          done={false}
        />
      </View>

      {/* ─────────────── STEP 1: ENROLLMENT FORM ─────────────── */}
      {step === 'form' && (
        <>
          <AppCard style={styles.formCard}>
            <AppSelect
              label="Select Course"
              options={courseOptions}
              value={selectedCourseId}
              onSelect={(val) => {
                setSelectedCourseId(val);
                setSelectedBatchId('');
              }}
            />

            <AppSelect
              label={isBatchesLoading ? 'Loading batches…' : 'Select Batch'}
              options={batchOptions}
              value={selectedBatchId}
              onSelect={setSelectedBatchId}
            />

            <AppSelect
              label="Attendance Mode"
              options={ATTENDANCE_MODES}
              value={attendanceModeId}
              onSelect={setAttendanceModeId}
            />

            <AppSelect
              label="Admission Counselor"
              options={counselorOptions}
              value={selectedCounselorUid}
              onSelect={setSelectedCounselorUid}
            />

            {/* ── Seat Availability Banner ── */}
            {selectedBatch && (
              <View style={styles.seatInfoWrapper}>
                {/* Total seats row */}
                <View style={styles.seatTotalRow}>
                  <SeatChip
                    label="Online"
                    count={selectedBatch.seat_availability?.online?.available ?? 0}
                    canEnroll={selectedBatch.seat_availability?.can_enroll_online}
                  />
                  <SeatChip
                    label="Offline"
                    count={selectedBatch.seat_availability?.offline?.available ?? 0}
                    canEnroll={selectedBatch.seat_availability?.can_enroll_offline}
                  />
                  <View style={styles.seatStatusChip}>
                    <AppText variant="caption" style={styles.seatStatusText}>
                      {selectedBatch.status}
                    </AppText>
                  </View>
                </View>

                {/* Mode-specific warning/ok banner */}
                {seatCheck && (
                  <View
                    style={[
                      styles.seatBanner,
                      { backgroundColor: seatBannerBg[seatCheck.severity] },
                    ]}
                  >
                    <Ionicons
                      name={seatBannerIcon[seatCheck.severity]}
                      size={16}
                      color={seatBannerColor[seatCheck.severity]}
                    />
                    <AppText
                      variant="caption"
                      style={[styles.seatBannerText, { color: seatBannerColor[seatCheck.severity] }]}
                    >
                      {seatCheck.message}
                    </AppText>
                  </View>
                )}
              </View>
            )}
          </AppCard>

          <AppButton
            title="Proceed to Admission"
            onPress={() => {
              if (!isFormValid) {
                Alert.alert('Validation', 'Please fill all fields before proceeding.');
                return;
              }
              if (seatCheck && !seatCheck.available) {
                Alert.alert(
                  'No Seats Available',
                  seatCheck.message + '\n\nPlease choose a different batch or attendance mode.'
                );
                return;
              }
              setStep('options');
            }}
            style={styles.primaryBtn}
            disabled={!isFormValid}
          />
        </>
      )}

      {/* ─────────────── STEP 2: ADMISSION OPTIONS ─────────────── */}
      {step === 'options' && (
        <>
          <AppCard style={styles.optionsCard}>
            <AppText variant="h3" style={styles.optionsTitle}>
              Choose Admission Method
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xl }}>
              How would you like to proceed with the enrollment?
            </AppText>

            {/* Send Payment Link */}
            <Pressable
              style={({ pressed }) => [
                styles.optionBtn,
                styles.paymentLinkBtn,
                pressed && styles.pressedBtn,
              ]}
              onPress={() => setStep('payment_link')}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="link-outline" size={24} color={colors.info} />
              </View>
              <View style={styles.optionContent}>
                <AppText style={styles.optionTitle}>Send Payment Link</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  Share a payment link with the student
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>

            {/* Create Manually */}
            <Pressable
              style={({ pressed }) => [
                styles.optionBtn,
                styles.manualBtn,
                pressed && styles.pressedBtn,
              ]}
              onPress={() => setStep('manual')}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="create-outline" size={24} color={colors.success} />
              </View>
              <View style={styles.optionContent}>
                <AppText style={styles.optionTitle}>Create Enrollment Manually</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  Enter payment details and create enrollment
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </AppCard>

          <AppButton
            title="← Back to Details"
            variant="outline"
            onPress={() => setStep('form')}
            style={styles.backBtn}
          />
        </>
      )}

      {/* ─────────────── STEP 3A: PAYMENT LINK ─────────────── */}
      {step === 'payment_link' && (
        <>
          <AppCard style={styles.linkCard}>
            <View style={styles.linkIconRow}>
              <View style={[styles.bigIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="link" size={32} color={colors.info} />
              </View>
            </View>
            <AppText variant="h3" style={styles.linkTitle}>
              Payment Link Ready
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={styles.linkSubtitle}>
              Share this link with the student to complete payment
            </AppText>

            <View style={styles.linkBox}>
              <AppText style={styles.linkText} numberOfLines={2}>
                {paymentLink}
              </AppText>
            </View>

            <View style={styles.linkActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.linkActionBtn,
                  { backgroundColor: colors.primary + '12' },
                  pressed && styles.pressedBtn,
                ]}
                onPress={handleCopyLink}
              >
                <Ionicons name="copy-outline" size={20} color={colors.primary} />
                <AppText style={[styles.linkActionText, { color: colors.primary }]}>
                  Copy
                </AppText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.linkActionBtn,
                  { backgroundColor: colors.success + '12' },
                  pressed && styles.pressedBtn,
                ]}
                onPress={handleShareLink}
              >
                <Ionicons name="share-social-outline" size={20} color={colors.success} />
                <AppText style={[styles.linkActionText, { color: colors.success }]}>
                  Share
                </AppText>
              </Pressable>
            </View>
          </AppCard>

          <AppButton
            title="← Back to Options"
            variant="outline"
            onPress={() => setStep('options')}
            style={styles.backBtn}
          />
        </>
      )}

      {/* ─────────────── STEP 3B: MANUAL ENROLLMENT ─────────────── */}
      {step === 'manual' && (
        <>
          <AppCard style={styles.formCard}>
            <AppText variant="h3" style={styles.manualTitle}>
              Payment Details
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
              Enter the payment information to create the enrollment
            </AppText>

            <AppSelect
              label="Payment Method"
              options={PAYMENT_METHODS}
              value={paymentMethod}
              onSelect={setPaymentMethod}
            />

            <AppInput
              label="Payment Reference"
              value={paymentReference}
              onChangeText={setPaymentReference}
              placeholder="Enter payment reference or transaction ID"
            />
          </AppCard>

          <AppButton
            title="Create Enrollment"
            onPress={handleManualSubmit}
            loading={enrollMutation.isPending}
            style={styles.primaryBtn}
          />

          <AppButton
            title="← Back to Options"
            variant="outline"
            onPress={() => setStep('options')}
            style={styles.backBtn}
          />
        </>
      )}

      <View style={{ height: 40 }} />
    </KeyboardAwareScrollView>
  );
}

/* ─── Step Indicator Component ─── */

function StepIndicator({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  const bg = done
    ? colors.success
    : active
      ? colors.primary
      : colors.surfaceSubtle;
  const textColor = done || active ? '#fff' : colors.textMuted;

  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepCircle, { backgroundColor: bg }]}>
        {done ? (
          <Ionicons name="checkmark" size={14} color="#fff" />
        ) : (
          <AppText style={[styles.stepNumber, { color: textColor }]}>
            {number}
          </AppText>
        )}
      </View>
      <AppText
        variant="caption"
        style={[
          styles.stepLabel,
          { color: active || done ? colors.textPrimary : colors.textMuted },
        ]}
      >
        {label}
      </AppText>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeatChip({ label, count, canEnroll }: { label: string; count: number; canEnroll?: boolean }) {
  const hasSeats = count > 0 && canEnroll !== false;
  const chipColor = hasSeats ? colors.success : colors.danger;
  return (
    <View style={[styles.seatChip, { backgroundColor: chipColor + '15', borderColor: chipColor + '40' }]}>
      <Ionicons
        name={hasSeats ? 'checkmark-circle' : 'close-circle'}
        size={12}
        color={chipColor}
      />
      <AppText variant="caption" style={[styles.seatChipText, { color: chipColor }]}>
        {label}: {count}
      </AppText>
    </View>
  );
}

const seatBannerColor: Record<string, string> = {
  ok: colors.success,
  warn: '#f59e0b',
  error: colors.danger,
};

const seatBannerBg: Record<string, string> = {
  ok: colors.success + '12',
  warn: '#f59e0b12',
  error: colors.danger + '12',
};

const seatBannerIcon: Record<string, any> = {
  ok: 'checkmark-circle-outline',
  warn: 'warning-outline',
  error: 'close-circle-outline',
};

/* ─── Styles ─── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },

  /* Header */
  headerCard: {
    padding: 0,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  gradientBanner: {
    padding: spacing.xl,
    alignItems: 'flex-start',
  },

  /* Steps */
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.sm,
    marginBottom: 18,
  },

  /* Form */
  formCard: {
    padding: spacing.xl,
    borderRadius: 24,
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },

  /* Options */
  optionsCard: {
    padding: spacing.xl,
    borderRadius: 24,
    marginBottom: spacing.lg,
  },
  optionsTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  paymentLinkBtn: {
    backgroundColor: colors.info + '06',
    borderColor: colors.info + '25',
  },
  manualBtn: {
    backgroundColor: colors.success + '06',
    borderColor: colors.success + '25',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },

  /* Link */
  linkCard: {
    padding: spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  linkIconRow: {
    marginBottom: spacing.md,
  },
  bigIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  linkSubtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  linkBox: {
    width: '100%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  linkText: {
    fontSize: 13,
    color: colors.info,
    fontWeight: '600',
    textAlign: 'center',
  },
  linkActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  linkActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  linkActionText: {
    fontSize: 15,
    fontWeight: '700',
  },

  /* Manual */
  manualTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },

  /* Buttons */
  primaryBtn: {
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  backBtn: {
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  pressedBtn: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  /* Seat info */
  seatInfoWrapper: {
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  seatTotalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  seatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  seatChipText: {
    fontWeight: '700',
    fontSize: 11,
  },
  seatStatusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.primaryLight + '15',
  },
  seatStatusText: {
    fontWeight: '700',
    fontSize: 11,
    color: colors.primary,
  },
  seatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  seatBannerText: {
    fontWeight: '700',
    fontSize: 12,
    flex: 1,
    flexWrap: 'wrap',
  },
});
