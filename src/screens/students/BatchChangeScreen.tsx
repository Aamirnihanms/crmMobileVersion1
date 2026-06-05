import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppLoader from '@/src/components/common/AppLoader';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { Batch } from '@/src/api/batches.api';
import {
  fetchBatchesPage,
  fetchCounselorsPage,
  fetchCoursesPage,
} from '@/src/api/masters/paginatedMasters.api';
import { useCreateBatchChangeRequest } from '@/src/queries/batch-change.query';
import { useEnrollmentDetails } from '@/src/queries/enrollment.query';
import { useStudentProfile } from '@/src/queries/students.query';
import { colors, spacing } from '@/src/theme';
import type { Course } from '@/src/types/course';
import type { Counselor } from '@/src/api/masters/counselors.api';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';

type RouteParams = {
  BatchChange: {
    enrollmentId: string;
    studentId: string;
  };
};

const PRIORITY_OPTIONS = [
  { label: '🔴  High', value: 'high' },
  { label: '🟡  Medium', value: 'medium' },
  { label: '🟢  Low', value: 'low' },
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

function checkSeatAvailability(batch: Batch | null, mode: string): SeatCheck | null {
  if (!batch || !mode) return null;
  const sa = batch.seat_availability;
  if (!sa) return null;

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function BatchChangeScreen() {
  const route = useRoute<RouteProp<RouteParams, 'BatchChange'>>();
  const navigation = useNavigation();
  const { enrollmentId, studentId } = route.params;

  // Data
  const { data: enrollment, isLoading: isEnrollmentLoading } = useEnrollmentDetails(enrollmentId);
  const { data: student, isLoading: isStudentLoading } = useStudentProfile(studentId);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [attendanceMode, setAttendanceMode] = useState('');
  const [selectedCounselorUid, setSelectedCounselorUid] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // ── Caches for full objects so we can look up names & seat info by id ──
  const [courseMap, setCourseMap] = useState<Record<string, Course>>({});
  const [batchMap, setBatchMap] = useState<Record<string, Batch>>({});
  const [counselorMap, setCounselorMap] = useState<Record<string, Counselor>>({});

  // Seed the counselor cache from the student profile (for pre-fill lookup)
  useEffect(() => {
    if (!student) return;
    const prefill = (student as any).admission_counselor;
    if (prefill && prefill.uid) {
      setCounselorMap((prev) => ({ ...prev, [prefill.uid]: prefill as Counselor }));
    }
  }, [student]);

  // ── AppSelect fetchOptions callbacks (backend search + infinite scroll) ──

  const fetchCourseOptions = useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchCoursesPage({ page, pageSize, search });
      setCourseMap((prev) => {
        const next = { ...prev };
        result.items.forEach((c) => {
          next[String(c.id)] = c;
        });
        return next;
      });
      return {
        options: result.items.map((c) => ({
          label: c.course_name,
          value: String(c.id),
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const fetchBatchOptions = useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      if (!selectedCourseId) {
        return { options: [], hasNextPage: false };
      }
      const result = await fetchBatchesPage({
        page,
        pageSize,
        search,
        courseId: selectedCourseId,
      });
      setBatchMap((prev) => {
        const next = { ...prev };
        result.items.forEach((b) => {
          next[b.uid] = b;
        });
        return next;
      });
      return {
        options: result.items.map((b) => ({
          label: b.batch_name,
          value: b.uid,
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    [selectedCourseId]
  );

  const fetchCounselorOptions = useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchCounselorsPage({ page, pageSize, search });
      setCounselorMap((prev) => {
        const next = { ...prev };
        result.items.forEach((c) => {
          const key = c.uid ?? String(c.id);
          next[key] = c;
        });
        return next;
      });
      return {
        options: result.items.map((c) => ({
          label: c.full_name,
          value: c.uid ?? String(c.id),
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const createMutation = useCreateBatchChangeRequest();

  // Pre-fill attendance mode & remarks from current enrollment
  useEffect(() => {
    if (!enrollment) return;
    const currentMode = (enrollment as any).attendance_mode?.value || '';
    if (currentMode) setAttendanceMode(currentMode);
    const batchName = enrollment.batch?.batch_name || 'current batch';
    setRemarks(`Student changing from ${batchName}`);
  }, [enrollment]);

  // Pre-fill counselor from student profile (admission_counselor_id is the UID)
  useEffect(() => {
    if (!student) return;
    const uid = (student as any).admission_counselor_id || (student as any).admission_counselor?.uid || '';
    if (uid) setSelectedCounselorUid(uid);
  }, [student]);

  const isLoading = isEnrollmentLoading || isStudentLoading;

  // ── Derived data (hooks must be called unconditionally — keep above any early returns) ──
  const selectedCourseObj = selectedCourseId ? courseMap[selectedCourseId] : undefined;
  const selectedBatch = selectedBatchId ? batchMap[selectedBatchId] ?? null : null;
  const selectedCounselorObj = selectedCounselorUid
    ? counselorMap[selectedCounselorUid]
    : undefined;

  // Show the currently-selected option in the closed dropdown so the label persists
  const selectedCourseOption = useMemo(
    () =>
      selectedCourseObj
        ? [{ label: selectedCourseObj.course_name, value: String(selectedCourseObj.id) }]
        : [],
    [selectedCourseObj]
  );
  const selectedBatchOption = useMemo(
    () =>
      selectedBatch
        ? [{ label: selectedBatch.batch_name, value: selectedBatch.uid }]
        : [],
    [selectedBatch]
  );
  const selectedCounselorOption = useMemo(
    () =>
      selectedCounselorObj
        ? [
            {
              label: selectedCounselorObj.full_name,
              value: selectedCounselorObj.uid ?? String(selectedCounselorObj.id),
            },
          ]
        : [],
    [selectedCounselorObj]
  );

  // Derive attendance mode options from the selected batch's course_mode_details
  // (real backend slugs, filtered to active modes only)
  const attendanceModeOptions = useMemo(() => {
    if (!selectedBatch) return [];
    return (selectedBatch.course_mode_details ?? [])
      .filter((m) => m.active)
      .map((m) => ({ label: m.name, value: m.value }));
  }, [selectedBatch]);

  // Seat availability check (live, recomputed on batch/mode change)
  const seatCheck = useMemo(
    () => checkSeatAvailability(selectedBatch, attendanceMode),
    [selectedBatch, attendanceMode]
  );

  if (isLoading) return <AppLoader />;
  if (!enrollment) return null;

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!selectedBatchId) {
      Alert.alert('Validation', 'Please select a new batch.');
      return;
    }
    if (!attendanceMode) {
      Alert.alert('Validation', 'Please select an attendance mode.');
      return;
    }
    if (seatCheck && !seatCheck.available) {
      Alert.alert(
        'No Seats Available',
        seatCheck.message + '\n\nPlease choose a different batch or attendance mode.'
      );
      return;
    }
    if (!selectedCounselorUid) {
      Alert.alert('Validation', 'Please select a counselor.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Validation', 'Please enter a reason for the batch change.');
      return;
    }

    createMutation.mutate(
      {
        studentId,
        payload: {
          current_enrollment_uid: enrollmentId,
          new_batch_uid: selectedBatchId,
          attendance_mode: attendanceMode,
          counselor_uid: selectedCounselorUid,
          remarks: remarks.trim(),
          reason: reason.trim(),
          priority,
        },
      },
      {
        onSuccess: (data) => {
          Alert.alert('Success', data?.message || 'Batch change request submitted successfully.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            JSON.stringify(error?.response?.data?.errors) ||
            'Failed to submit batch change request.';
          Alert.alert('Error', msg);
        },
      }
    );
  };

  // ── Display values ────────────────────────────────────────────────────────

  const currentCourseName = enrollment.batch?.course_name || 'N/A';
  const currentBatchName = enrollment.batch?.batch_name || 'N/A';
  const currentAttendanceName = (enrollment as any).attendance_mode?.name || 'N/A';
  const currentCounselorName =
    (student as any)?.admission_counselor?.full_name ||
    (enrollment as any).admission_counselor_detail?.name ||
    'N/A';

  const priorityColor: Record<string, string> = {
    high: colors.danger,
    medium: '#f59e0b',
    low: colors.success,
  };

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

  return (
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      bottomOffset={80}
    >
      {/* ── Current Enrollment Details ── */}
      <AppCard style={styles.currentCard}>
        <LinearGradient
          colors={[colors.primary, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBanner}
        >
          <Ionicons name="swap-horizontal-outline" size={22} color="#fff" style={{ marginBottom: 6 }} />
          <AppText variant="h3" color="#fff" style={{ fontWeight: '800' }}>
            Batch Change Request
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }}>
            Submit a request to move this student to a different batch
          </AppText>
        </LinearGradient>

        <View style={styles.currentDetails}>
          <AppText variant="caption" color={colors.textMuted} style={styles.detailsLabel}>
            CURRENT ENROLLMENT DETAILS
          </AppText>
          <InfoRow icon="book-outline" label="Course" value={currentCourseName} />
          <InfoRow icon="grid-outline" label="Batch" value={currentBatchName} />
          <InfoRow icon="desktop-outline" label="Attendance Mode" value={currentAttendanceName} />
          <InfoRow icon="person-outline" label="Admission Counselor" value={currentCounselorName} />
        </View>
      </AppCard>

      {/* ── New Batch Form ── */}
      <View style={styles.sectionHeader}>
        <AppText variant="h3" style={styles.sectionTitle}>New Batch Details</AppText>
      </View>

      <AppCard style={styles.formCard}>
        {/* Course */}
        <AppSelect
          label="Select Course"
          options={selectedCourseOption}
          value={selectedCourseId}
          fetchOptions={fetchCourseOptions}
          queryKey={['batch-change', 'courses']}
          onSelect={(val) => {
            setSelectedCourseId(String(val));
            setSelectedBatchId('');
          }}
        />

        {/* Batch — gated on course selection (no fetchOptions until a course is chosen) */}
        <AppSelect
          label={selectedCourseId ? 'Select Batch' : 'Select course first'}
          options={selectedBatchOption}
          value={selectedBatchId}
          fetchOptions={selectedCourseId ? fetchBatchOptions : undefined}
          queryKey={['batch-change', 'batches', selectedCourseId]}
          error={!selectedCourseId ? 'Please select a course first' : undefined}
          onSelect={(val) => {
            setSelectedBatchId(String(val));
            setAttendanceMode('');
          }}
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

        {/* Attendance Mode — gated on batch selection; options derived from selected batch */}
        <AppSelect
          label={selectedBatchId ? 'Attendance Mode' : 'Select batch first'}
          options={attendanceModeOptions}
          value={attendanceMode}
          error={!selectedBatchId ? 'Please select a batch first' : undefined}
          onSelect={setAttendanceMode}
        />

        {/* Counselor */}
        <AppSelect
          label="Counselor"
          options={selectedCounselorOption}
          value={selectedCounselorUid}
          fetchOptions={fetchCounselorOptions}
          queryKey={['batch-change', 'counselors']}
          onSelect={setSelectedCounselorUid}
        />

        {/* Remarks */}
        <AppInput
          label="Remarks"
          value={remarks}
          onChangeText={setRemarks}
          multiline
          placeholder={`Student changing from ${currentBatchName}`}
        />

        {/* Reason */}
        <AppInput
          label="Reason *"
          value={reason}
          onChangeText={setReason}
          multiline
          placeholder="Why is this student changing batch?"
        />

        {/* Priority */}
        <View>
          <AppText variant="caption" color={colors.textMuted} style={styles.priorityLabel}>
            PRIORITY
          </AppText>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map((opt) => {
              const isSelected = priority === opt.value;
              const col = priorityColor[opt.value];
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.priorityBtn,
                    isSelected && { backgroundColor: col + '18', borderColor: col },
                  ]}
                  onPress={() => setPriority(opt.value as 'high' | 'medium' | 'low')}
                  activeOpacity={0.75}
                >
                  <AppText
                    variant="caption"
                    style={[
                      styles.priorityBtnText,
                      { color: isSelected ? col : colors.textMuted, fontWeight: isSelected ? '800' : '600' },
                    ]}
                  >
                    {opt.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </AppCard>

      {/* ── Submit ── */}
      <AppButton
        title="Submit Batch Change Request"
        onPress={handleSubmit}
        loading={createMutation.isPending}
        style={[
          styles.submitBtn,
          seatCheck && !seatCheck.available && { opacity: 0.5 },
        ]}
      />

      <View style={{ height: 40 }} />
    </KeyboardAwareScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText
          variant="caption"
          color={colors.textMuted}
          style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}
        >
          {label}
        </AppText>
        <AppText style={{ fontWeight: '600', fontSize: 14, color: colors.textPrimary }} numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },

  /* Current card */
  currentCard: {
    padding: 0,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  gradientBanner: {
    padding: spacing.xl,
    paddingBottom: spacing.xl * 1.4,
    alignItems: 'flex-start',
  },
  currentDetails: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -spacing.lg,
    gap: spacing.md,
  },
  detailsLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Section */
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 4,
  },

  /* Form */
  formCard: {
    padding: spacing.xl,
    borderRadius: 24,
    gap: spacing.lg,
    marginBottom: spacing.xl,
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

  /* Priority */
  priorityLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.surfaceSubtle,
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle + '60',
  },
  priorityBtnText: {
    fontSize: 12,
  },

  submitBtn: {
    borderRadius: 16,
  },
});
