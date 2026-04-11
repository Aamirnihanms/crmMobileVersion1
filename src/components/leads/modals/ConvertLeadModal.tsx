import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';

import { colors, spacing } from '@/src/theme';

import { useBatches } from '@/src/queries/masters/batches.query';
import { useCourses } from '@/src/queries/masters/courses.query';

type Props = {
  visible: boolean;
  onClose: () => void;
  lead: any; // LeadDetails object
  onSubmit: (payload: any) => void;
  loading?: boolean;
};

export default function ConvertLeadModalPro({
  visible,
  onClose,
  lead,
  onSubmit,
  loading = false,
}: Props) {
  const [form, setForm] = useState<any>({
    course_id: null,
    batch_uid: null,
    attendance_mode: null,
    preferred_location: null,
    payment_method: null,
  });

  const { data: courses = [], error: coursesError } = useCourses(visible);
  const { data: batches = [], error: batchesError } = useBatches(form.course_id, visible);

  const getErrorMessage = (err: any) => {
    if (!err) return undefined;
    const data = err?.response?.data;
    return data?.detail || data?.error || err?.message || 'Failed to load';
  };

  useEffect(() => {
    if (!lead) return;
    setForm({
      course_id: lead.course_details?.id || null,
      preferred_location: lead.course_details?.location_details?.[0]?.id || null,
    });
  }, [lead]);

  useEffect(() => {
    setForm((prev: any) => ({
      ...prev,
      batch_uid: null,
    }));
  }, [form.course_id]);

  const selectedCourse = useMemo(() => {
    return courses.find((c: any) => c.id === form.course_id);
  }, [form.course_id, courses]);

  const attendanceModes = [
    { label: 'Online', value: '1' },
    { label: 'Offline', value: '2' },
  ];

  const paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Razorpay', value: 'razorpay' },
    { label: 'Bank Transfer', value: 'bank' },
  ];

  const handleSubmit = () => {
    if (
      !form.course_id ||
      !form.batch_uid ||
      !form.attendance_mode ||
      !form.preferred_location ||
      !form.payment_method
    ) {
      Alert.alert('Missing Fields', 'Please fill all required fields to proceed.');
      return;
    }

    const payload = {
      lead_id: lead?.id,
      course_id: form.course_id,
      batch_uid: form.batch_uid,
      attendance_mode: form.attendance_mode,
      preferred_location: form.preferred_location,
      payment_method: form.payment_method,
    };

    onSubmit(payload);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.indicator} />

          <View style={styles.header}>
            <View>
              <AppText variant="h2">Enroll Student</AppText>
              <AppText variant="caption" color={colors.textMuted}>Convert lead to active enrollment</AppText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <AppSelect
              label="Selected Course"
              value={form.course_id}
              options={courses.map((c: any) => ({
                label: c.course_name,
                value: c.id,
              }))}
              onSelect={(v) => setForm({ ...form, course_id: v })}
              error={getErrorMessage(coursesError)}
            />

            <AppSelect
              label="Select Batch"
              value={form.batch_uid}
              options={batches.map(b => ({
                label: b.batch_name,
                value: b.uid,
              }))}
              onSelect={(v) => setForm({ ...form, batch_uid: v })}
              error={getErrorMessage(batchesError)}
            />

            <AppSelect
              label="Attendance Mode"
              value={form.attendance_mode}
              options={attendanceModes}
              onSelect={(v) => setForm({ ...form, attendance_mode: v })}
            />

            <AppSelect
              label="Preferred Location"
              value={form.preferred_location}
              options={
                selectedCourse?.location_details?.map((l: any) => ({
                  label: l.name,
                  value: l.id,
                })) || []
              }
              onSelect={(v) => setForm({ ...form, preferred_location: v })}
            />

            <AppSelect
              label="Payment Method"
              value={form.payment_method}
              options={paymentMethods}
              onSelect={(v) => setForm({ ...form, payment_method: v })}
            />

            <View style={styles.footer}>
              <Pressable onPress={handleSubmit} style={{ flex: 1 }} disabled={loading}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.saveBtn}
                >
                  <AppText style={styles.saveBtnText}>
                    {loading ? 'Processing...' : 'Complete Enrollment'}
                  </AppText>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dismissArea: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '90%',
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  footer: {
    marginTop: spacing.xl,
  },
  saveBtn: {
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
