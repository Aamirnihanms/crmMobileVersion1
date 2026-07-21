import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
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
import { useRejoinStudent } from '@/src/queries/enrollment.query';

import { useAppTheme, spacing } from '@/src/theme';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import { Batch } from '@/src/api/batches.api';

type SeatCheck = {
  available: boolean;
  message: string;
  severity: 'ok' | 'warn' | 'error';
};

const ATTENDANCE_MODES = [
  { label: 'Online', value: '1' },
  { label: 'Offline', value: '2' },
  { label: 'Hybrid', value: '3' },
];

// Seat availability check logic (same as NewEnrollmentScreen)
function checkSeatAvailability(batch: Batch | null, modeId: string): SeatCheck | null {
  if (!batch || !modeId) return null;
  const sa = batch.seat_availability;
  if (!sa) return null;

  const modeMap: Record<string, string> = { '1': 'online', '2': 'offline', '3': 'hybrid' };
  const mode = modeMap[modeId];
  if (!mode) return null;

  const onlineAvail = sa.online?.available ?? 0;
  const offlineAvail = sa.offline?.available ?? 0;
  const canOnline = sa.can_enroll_online ?? onlineAvail > 0;
  const canOffline = sa.can_enroll_offline ?? offlineAvail > 0;

  if (mode === 'online') {
    if (!canOnline || onlineAvail === 0) return { available: false, message: `No online seats available (Online: ${onlineAvail} left)`, severity: 'error' };
    return { available: true, message: `${onlineAvail} online seats available`, severity: 'ok' };
  }
  if (mode === 'offline') {
    if (!canOffline || offlineAvail === 0) return { available: false, message: `No offline seats available (Offline: ${offlineAvail} left)`, severity: 'error' };
    return { available: true, message: `${offlineAvail} offline seats available`, severity: 'ok' };
  }
  if (mode === 'hybrid') {
    if (!canOffline || offlineAvail === 0) return { available: false, message: `No offline seats available. Hybrid requires offline capacity.`, severity: 'error' };
    if (!canOnline || onlineAvail === 0) return { available: true, message: `Hybrid — Online full, Offline: ${offlineAvail} left`, severity: 'warn' };
    return { available: true, message: `Online: ${onlineAvail} · Offline: ${offlineAvail} available`, severity: 'ok' };
  }
  return null;
}

export default function RejoinStudentScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MoreStackParamList, 'RejoinStudent'>>();
  const { student } = route.params;
  const droppedEnrollment = student.dropped_enrollments?.[0];

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [attendanceModeId, setAttendanceModeId] = useState('');
  const [selectedCounselorUid, setSelectedCounselorUid] = useState('');
  const [remarks, setRemarks] = useState(`Student rejoining from ${droppedEnrollment?.batch?.course || droppedEnrollment?.batch?.course_name || 'previous course'}`);

  const { data: courses, isLoading: isCoursesLoading } = useCourses();
  const { data: counselors, isLoading: isCounselorsLoading } = useCounselors();
  const { data: batchPages, isLoading: isBatchesLoading } = useInfiniteBatches('', {
    course_id: selectedCourseId || undefined,
  });

  const rejoinMutation = useRejoinStudent();

  // Initialize form with dropped enrollment details
  useEffect(() => {
    if (courses && droppedEnrollment) {
      const courseName = droppedEnrollment.batch.course || droppedEnrollment.batch.course_name;
      const course = courses.find(c => c.course_name === courseName);
      if (course) {
        setSelectedCourseId(String(course.id));
      }
    }
    if (student.admission_counselor?.uid) {
        setSelectedCounselorUid(student.admission_counselor.uid);
    }
  }, [courses, droppedEnrollment, student]);

  const courseOptions = (courses || []).map((c: any) => ({ label: c.course_name, value: String(c.id) }));
  const allBatches = batchPages?.pages.flatMap((p) => p.batches) || [];
  const batchOptions = allBatches.map((b) => ({ label: b.batch_name, value: b.uid }));
  const counselorOptions = (counselors || []).map((c: any) => ({ label: c.full_name, value: c.uid ?? c.id?.toString() }));

  const selectedBatch = allBatches.find((b) => b.uid === selectedBatchId) ?? null;
  const seatCheck = useMemo(() => checkSeatAvailability(selectedBatch, attendanceModeId), [selectedBatch, attendanceModeId]);

  const handleRejoin = () => {
    if (!selectedCourseId || !selectedBatchId || !attendanceModeId || !selectedCounselorUid) {
      Alert.alert('Validation', 'Please fill all required fields.');
      return;
    }

    if (seatCheck && !seatCheck.available) {
      Alert.alert('No Seats Available', seatCheck.message);
      return;
    }

    rejoinMutation.mutate({
      studentId: student.student_id,
      payload: {
        attendance_mode_uid: attendanceModeId,
        counselor_uid: selectedCounselorUid,
        course_uid: selectedCourseId,
        dropped_enrollment_uid: droppedEnrollment?.uid,
        new_batch_uid: selectedBatchId,
        remarks: remarks.trim(),
        student_uid: student.uid,
      }
    }, {
      onSuccess: (data) => {
        Alert.alert('Success', data?.message || 'Student rejoined successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.detail || error?.response?.data?.message || 'Failed to rejoin student.';
        Alert.alert('Error', msg);
      }
    });
  };

  if (isCoursesLoading || isCounselorsLoading) return <AppLoader />;

  return (
    <KeyboardAwareScrollView style={styles.root} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <AppCard style={styles.headerCard}>
        <LinearGradient colors={[colors.primary, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBanner}>
          <Ionicons name="refresh-circle-outline" size={24} color="#fff" style={{ marginBottom: 6 }} />
          <AppText variant="h3" color="#fff" style={{ fontWeight: '800' }}>Rejoin Student</AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.8)">{student.full_name} ({student.student_id})</AppText>
        </LinearGradient>
      </AppCard>

      <AppCard style={styles.formCard}>
        <AppSelect label="Select Course" options={courseOptions} value={selectedCourseId} onSelect={(val) => { setSelectedCourseId(val); setSelectedBatchId(''); }} />
        <AppSelect label={isBatchesLoading ? 'Loading batches…' : 'Select New Batch'} options={batchOptions} value={selectedBatchId} onSelect={setSelectedBatchId} />
        <AppSelect label="Attendance Mode" options={ATTENDANCE_MODES} value={attendanceModeId} onSelect={setAttendanceModeId} />
        <AppSelect label="Admission Counselor" options={counselorOptions} value={selectedCounselorUid} onSelect={setSelectedCounselorUid} />
        
        <AppInput label="Remarks" value={remarks} onChangeText={setRemarks} placeholder="Enter any notes..." multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />

        {selectedBatch && (
          <View style={styles.seatInfoWrapper}>
            <View style={styles.seatTotalRow}>
              <SeatChip label="Online" count={selectedBatch.seat_availability?.online?.available ?? 0} canEnroll={selectedBatch.seat_availability?.can_enroll_online} />
              <SeatChip label="Offline" count={selectedBatch.seat_availability?.offline?.available ?? 0} canEnroll={selectedBatch.seat_availability?.can_enroll_offline} />
            </View>
            {seatCheck && (
              <View style={[styles.seatBanner, { backgroundColor: getSeatBannerBg(colors)[seatCheck.severity] }]}>
                <Ionicons name={seatBannerIcon[seatCheck.severity]} size={16} color={getSeatBannerColor(colors)[seatCheck.severity]} />
                <AppText variant="caption" style={[styles.seatBannerText, { color: getSeatBannerColor(colors)[seatCheck.severity] }]}>{seatCheck.message}</AppText>
              </View>
            )}
          </View>
        )}
      </AppCard>

      <AppButton title="Rejoin Student" onPress={handleRejoin} loading={rejoinMutation.isPending} style={styles.submitBtn} />
      <View style={{ height: 40 }} />
    </KeyboardAwareScrollView>
  );
}

function SeatChip({ label, count, canEnroll }: any) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const hasSeats = count > 0 && canEnroll !== false;
  const chipColor = hasSeats ? colors.success : colors.danger;
  return (
    <View style={[styles.seatChip, { backgroundColor: chipColor + '15', borderColor: chipColor + '40' }]}>
      <Ionicons name={hasSeats ? 'checkmark-circle' : 'close-circle'} size={12} color={chipColor} />
      <AppText variant="caption" style={[styles.seatChipText, { color: chipColor }]}>{label}: {count}</AppText>
    </View>
  );
}

const getSeatBannerColor = (colors: any) => ({ ok: colors.success, warn: '#f59e0b', error: colors.danger });
const getSeatBannerBg = (colors: any) => ({ ok: colors.success + '12', warn: '#f59e0b12', error: colors.danger + '12' });
const seatBannerIcon: any = { ok: 'checkmark-circle-outline', warn: 'warning-outline', error: 'close-circle-outline' };

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg },
  headerCard: { padding: 0, borderRadius: 24, overflow: 'hidden', marginBottom: spacing.xl },
  gradientBanner: { padding: spacing.xl, alignItems: 'flex-start' },
  formCard: { padding: spacing.xl, borderRadius: 24, gap: spacing.lg, marginBottom: spacing.lg },
  seatInfoWrapper: { marginTop: spacing.xs, gap: spacing.md },
  seatTotalRow: { flexDirection: 'row', gap: spacing.sm },
  seatChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, gap: 4 },
  seatChipText: { fontWeight: '700', fontSize: 11 },
  seatBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8 },
  seatBannerText: { fontWeight: '600', flex: 1 },
  submitBtn: { borderRadius: 16, height: 56 },
});
