import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { useAppTheme, spacing } from '@/src/theme';

import { Batch } from '@/src/api/batches.api';
import {
  fetchBatchesPage,
  fetchCoursesPage,
} from '@/src/api/masters/paginatedMasters.api';
import type { Course } from '@/src/types/course';

type Props = {
  visible: boolean;
  onClose: () => void;
  lead: any; // LeadDetails object
  onSubmit: (payload: any) => void;
  loading?: boolean;
  error?: any;
};

export default function ConvertLeadModalPro({
  visible,
  onClose,
  lead,
  onSubmit,
  loading = false,
  error,
}: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [form, setForm] = useState<any>({
    course_id: null,
    batch_uid: null,
    attendance_mode: null,
    preferred_location: null,
    payment_method: null,
  });

  // ── Caches for full course/batch objects ──
  const [courseMap, setCourseMap] = useState<Record<string, Course>>({});
  const [batchMap, setBatchMap] = useState<Record<string, Batch>>({});
  const [fetchError, setFetchError] = useState<{ courses?: string; batches?: string }>({});

  // Pre-seed course cache from the lead's pre-filled course so the label is visible
  // immediately in the closed dropdown (avoids the "blank label until first open" UX gap)
  useEffect(() => {
    if (!visible || !lead) return;
    const seed = lead?.course_details;
    if (seed?.id) {
      setCourseMap((prev) => ({ ...prev, [String(seed.id)]: seed as Course }));
    }
  }, [lead, visible]);

  // ── AppSelect fetchOptions callbacks (backend search + infinite scroll) ──

  const fetchCourseOptions = useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      setFetchError((e) => ({ ...e, courses: undefined }));
      try {
        const result = await fetchCoursesPage({ page, pageSize, search });
        setCourseMap((prev) => {
          const next = { ...prev };
          result.items.forEach((c) => {
            next[String(c.id)] = c;
          });
          return next;
        });
        return {
          options: result.items.map((c) => ({ label: c.course_name, value: c.id })),
          hasNextPage: result.hasNextPage,
        };
      } catch (err: any) {
        setFetchError((e) => ({ ...e, courses: getErrorMessage(err) }));
        return { options: [], hasNextPage: false };
      }
    },
    []
  );

  const fetchBatchOptions = useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      if (!form.course_id) {
        return { options: [], hasNextPage: false };
      }
      setFetchError((e) => ({ ...e, batches: undefined }));
      try {
        const result = await fetchBatchesPage({
          page,
          pageSize,
          search,
          courseId: form.course_id,
        });
        setBatchMap((prev) => {
          const next = { ...prev };
          result.items.forEach((b) => {
            next[b.uid] = b;
          });
          return next;
        });
        return {
          options: result.items.map((b) => ({ label: b.batch_name, value: b.uid })),
          hasNextPage: result.hasNextPage,
        };
      } catch (err: any) {
        setFetchError((e) => ({ ...e, batches: getErrorMessage(err) }));
        return { options: [], hasNextPage: false };
      }
    },
    [form.course_id]
  );

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
      attendance_mode: null,
      // preferred_location intentionally NOT reset
    }));
  }, [form.course_id]);

  const selectedCourseObj = form.course_id ? courseMap[String(form.course_id)] : undefined;
  const selectedBatchObj = form.batch_uid ? batchMap[form.batch_uid] : null;

  // Derive attendance mode options from the selected batch's course_mode_details
  const attendanceModeOptions = useMemo(() => {
    if (!selectedBatchObj) return [];
    return (selectedBatchObj.course_mode_details ?? [])
      .filter((m) => m.active)
      .map((m) => ({ label: m.name, value: String(m.id) }));
  }, [selectedBatchObj]);

  // Show the currently-selected option in the closed dropdown so the label persists
  const selectedCourseOption = useMemo(
    () =>
      selectedCourseObj
        ? [{ label: selectedCourseObj.course_name, value: selectedCourseObj.id }]
        : [],
    [selectedCourseObj]
  );
  const selectedBatchOption = useMemo(
    () =>
      selectedBatchObj
        ? [{ label: selectedBatchObj.batch_name, value: selectedBatchObj.uid }]
        : [],
    [selectedBatchObj]
  );

  const paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Razorpay', value: 'razorpay' },
    { label: 'Bank Transfer', value: 'bank' },
  ];

  const submitError = useMemo(() => {
    if (!error) return null;
    const data = error?.response?.data;
    return {
      message: data?.message || data?.error || error?.message || 'Something went wrong',
      suggestion: data?.suggestion,
      code: data?.error_code,
    };
  }, [error]);

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

    // Find the selected batch to get admission_fees
    const selectedBatch = form.batch_uid ? batchMap[form.batch_uid] : null;
    const payment_amount = selectedBatch?.admission_fees || 0;

    const payload = {
      lead_id: lead?.id,
      course_id: form.course_id,
      batch_uid: form.batch_uid,
      attendance_mode: form.attendance_mode,
      preferred_location: form.preferred_location,
      payment_method: form.payment_method,
      payment_amount: payment_amount,
    };

    console.log('📦 Conversion Modal Payload Constructed:', payload);
    onSubmit(payload);
  };

  return (
    <Modal statusBarTranslucent navigationBarTranslucent visible={visible} transparent animationType="fade">
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
              options={selectedCourseOption}
              value={form.course_id}
              fetchOptions={fetchCourseOptions}
              queryKey={['convert-lead', 'courses']}
              error={fetchError.courses}
              onSelect={(v) => setForm({ ...form, course_id: v })}
            />

            <AppSelect
              label={form.course_id ? 'Select Batch' : 'Select course first'}
              options={selectedBatchOption}
              value={form.batch_uid}
              fetchOptions={form.course_id ? fetchBatchOptions : undefined}
              queryKey={['convert-lead', 'batches', form.course_id]}
              error={!form.course_id ? 'Please select a course first' : fetchError.batches}
              onSelect={(v) => setForm({ ...form, batch_uid: v })}
            />

            <AppSelect
              label={form.batch_uid ? 'Attendance Mode' : 'Select batch first'}
              options={attendanceModeOptions}
              value={form.attendance_mode}
              error={!form.batch_uid ? 'Please select a batch first' : undefined}
              onSelect={(v) => setForm({ ...form, attendance_mode: v })}
            />

            <AppSelect
              label="Preferred Location"
              value={form.preferred_location}
              options={
                selectedCourseObj?.location_details?.map((l: any) => ({
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

            {submitError && (
              <View style={styles.errorContainer}>
                <View style={styles.errorHeader}>
                  <Ionicons name="alert-circle" size={20} color={colors.danger} />
                  <AppText style={styles.errorTitle}>Enrollment Failed</AppText>
                </View>
                <AppText style={styles.errorMessage}>{submitError.message}</AppText>
                {submitError.suggestion && (
                  <View style={styles.suggestionBox}>
                    <AppText variant="caption" style={styles.suggestionText}>
                      💡 {submitError.suggestion}
                    </AppText>
                  </View>
                )}
              </View>
            )}

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

const getStyles = (colors: any) => StyleSheet.create({
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
  errorContainer: {
    backgroundColor: colors.danger + '10',
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  errorTitle: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  errorMessage: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  suggestionBox: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  suggestionText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
