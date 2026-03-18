import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import { useEffect, useState, useMemo } from 'react';

import AppSelect from '@/src/components/common/AppSelect';
import AppButton from '@/src/components/common/AppButton';
import AppText from '@/src/components/common/AppText';

import { spacing } from '@/src/theme';

import { useCourses } from '@/src/queries/masters/courses.query';
import { useBatches } from '@/src/queries/masters/batches.query';

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
  /* ---------------- FORM STATE ---------------- */

  const [form, setForm] = useState<any>({
    course_id: null,
    batch_uid: null,
    attendance_mode: null,
    preferred_location: null,
    payment_method: null,
  });

  /* ---------------- MASTER DATA ---------------- */

  const { data: courses = [] } = useCourses();
  const { data: batches = [] } = useBatches(form.course_id);

  console.log('🚀 Batches for course', form.course_id, batches);

  /* ---------------- PREFILL FROM LEAD ---------------- */

useEffect(() => {
  if (!lead) return;

  setForm({
    course_id: lead.course_details?.id || null,
    preferred_location:
      lead.course_details?.location_details?.[0]?.id || null,
  });
}, [lead]);

  useEffect(() => {
  setForm((prev: any) => ({
    ...prev,
    batch_uid: null,
  }));
}, [form.course_id]);

  /* ---------------- RESET BATCH WHEN COURSE CHANGES ---------------- */

  useEffect(() => {
    setForm((prev: any) => ({
      ...prev,
      batch_uid: null,
    }));
  }, [form.course_id]);

  /* ---------------- SELECTED COURSE ---------------- */

  const selectedCourse = useMemo(() => {
    return courses.find(
      (c: any) => c.id === form.course_id
    );
  }, [form.course_id, courses]);

  /* ---------------- OPTIONS ---------------- */

  const attendanceModes = [
    { label: 'Online', value: '1' },
    { label: 'Offline', value: '2' },
  ];

  const paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Razorpay', value: 'razorpay' },
    { label: 'Bank Transfer', value: 'bank' },
  ];

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = () => {
    if (
      !form.course_id ||
      !form.batch_uid ||
      !form.attendance_mode ||
      !form.preferred_location ||
      !form.payment_method
    ) {
      Alert.alert('Please fill all required fields');
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

    console.log('🚀 Convert Payload:', payload);

    onSubmit(payload);
  };

  /* ---------------- RENDER ---------------- */

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.container}>
          <AppText variant="heading">
            Convert Lead to Student
          </AppText>

          {/* -------- COURSE -------- */}

          <AppSelect
            label="Course"
            value={form.course_id}
            options={courses.map((c: any) => ({
              label: c.course_name,
              value: c.id,
            }))}
            onSelect={(v) =>
              setForm({ ...form, course_id: v })
            }
          />

          {/* -------- BATCH -------- */}

<AppSelect
  label="Batch"
  value={form.batch_uid}
  options={batches.map(b => ({
    label: b.batch_name,
    value: b.uid,
  }))}
  onSelect={(v) => setForm({ ...form, batch_uid: v })}
/>

          {/* -------- ATTENDANCE MODE -------- */}

          <AppSelect
            label="Attendance Mode"
            value={form.attendance_mode}
            options={attendanceModes}
            onSelect={(v) =>
              setForm({ ...form, attendance_mode: v })
            }
          />

          {/* -------- LOCATION (FROM COURSE) -------- */}

          <AppSelect
            label="Preferred Location"
            value={form.preferred_location}
            options={
              selectedCourse?.location_details?.map(
                (l: any) => ({
                  label: l.name,
                  value: l.id,
                })
              ) || []
            }
            onSelect={(v) =>
              setForm({
                ...form,
                preferred_location: v,
              })
            }
          />

          {/* -------- PAYMENT METHOD -------- */}

          <AppSelect
            label="Payment Method"
            value={form.payment_method}
            options={paymentMethods}
            onSelect={(v) =>
              setForm({ ...form, payment_method: v })
            }
          />
        </ScrollView>

        {/* -------- FOOTER -------- */}

        <View style={styles.footer}>
          <AppButton
            title={loading ? 'Converting...' : 'Convert Lead'}
            onPress={handleSubmit}
            disabled={loading}
          />

          <View style={{ height: spacing.sm }} />

          <AppButton
            title="Cancel"
            variant="secondary"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  container: {
    padding: spacing.lg,
    paddingBottom: 120,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: '#fff',
  },
});