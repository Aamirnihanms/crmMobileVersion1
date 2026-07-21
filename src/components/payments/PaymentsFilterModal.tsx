import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  fetchCounselorsPage,
  fetchCoursesPage,
  fetchBatchesPage,
} from '@/src/api/masters/paginatedMasters.api';
import type { PaymentFilters } from '@/src/api/payments.api';
import AppDatePicker from '@/src/components/common/AppDatePicker';
import AppMultiSelect from '@/src/components/common/AppMultiSelect';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';

import { useAppTheme, spacing } from '@/src/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: PaymentFilters;
  setAllFilters: (filters: PaymentFilters) => void;
};

const PAYMENT_STATUS_OPTIONS = [
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
];

const PAYMENT_PERIOD_OPTIONS = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
];

export default function PaymentsFilterModal({
  visible,
  onClose,
  filters,
  setAllFilters,
}: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [localFilters, setLocalFilters] = React.useState<PaymentFilters>(filters || {});

  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters || {});
    }
  }, [visible, filters]);

  const updateLocalFilter = (key: string, value: any) => {
    setLocalFilters((prev: any) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const fetchCourseOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchCoursesPage({ page, pageSize, search });
      return {
        options: result.items.map((item) => ({
          label: item.course_name,
          value: item.id.toString(),
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const fetchCounselorOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchCounselorsPage({ page, pageSize, search });
      return {
        options: result.items.map((item) => ({
          label: item.full_name,
          value: item.uid || item.id.toString(),
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const clearFilters = () => {
    setLocalFilters({});
  };

  const applyFilters = () => {
    setAllFilters(localFilters);
    onClose();
  };

  return (
    <Modal statusBarTranslucent navigationBarTranslucent visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.indicator} />

          <View style={styles.header}>
            <View>
              <AppText variant="h2">Filters</AppText>
              <AppText variant="caption" color={colors.textMuted}>Refine transactions list</AppText>
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={clearFilters} style={styles.clearBtn}>
                <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>Clear All</AppText>
              </Pressable>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <AppDatePicker
                label="Date From"
                value={localFilters.date_from || ''}
                onChange={(date) => {
                  updateLocalFilter('date_from', date);
                  updateLocalFilter('period', null);
                  updateLocalFilter('time_period', null);
                }}
                containerStyle={{ flex: 1 }}
              />
              <AppDatePicker
                label="Date To"
                value={localFilters.date_to || ''}
                onChange={(date) => {
                  updateLocalFilter('date_to', date);
                  updateLocalFilter('period', null);
                  updateLocalFilter('time_period', null);
                }}
                containerStyle={{ flex: 1 }}
                minimumDate={localFilters.date_from ? new Date(localFilters.date_from) : undefined}
              />
            </View>

            <AppSelect
              label="Time Period"
              value={localFilters.time_period === 'yesterday' ? 'yesterday' : (localFilters.period || undefined)}
              options={PAYMENT_PERIOD_OPTIONS}
              onSelect={(v) => {
                const val = v ? String(v) : null;
                if (val === 'yesterday') {
                  updateLocalFilter('time_period', 'yesterday');
                  updateLocalFilter('period', null);
                } else {
                  updateLocalFilter('period', val);
                  updateLocalFilter('time_period', null);
                }
                if (val) {
                  updateLocalFilter('date_from', null);
                  updateLocalFilter('date_to', null);
                }
              }}
            />

            <AppSelect
              label="Course"
              value={localFilters.course || undefined}
              options={[]}
              fetchOptions={fetchCourseOptions}
              queryKey={['filters', 'payments', 'courses']}
              onSelect={(v) => {
                const newCourse = v ? String(v) : null;
                updateLocalFilter('course', newCourse);
                // Clear batch if course is changed or cleared
                if (newCourse !== localFilters.course) {
                  updateLocalFilter('batch', null);
                }
              }}
            />

            {localFilters.course && (
              <AppSelect
                label="Batch"
                value={localFilters.batch || undefined}
                options={[]}
                fetchOptions={async ({ page, pageSize, search }) => {
                  const result = await fetchBatchesPage({ page, pageSize, search, courseId: localFilters.course! });
                  return {
                    options: result.items.map((item) => ({
                      label: item.batch_name,
                      value: item.uid, // Batches mostly use uid or id, let's look down below using item.uid
                    })),
                    hasNextPage: result.hasNextPage,
                  };
                }}
                queryKey={['filters', 'payments', 'batches', localFilters.course]}
                onSelect={(v) => updateLocalFilter('batch', v ? String(v) : null)}
              />
            )}

            <AppMultiSelect
              label="Counselor"
              value={localFilters.counselor_id ? localFilters.counselor_id.split(',') : []}
              options={[]}
              fetchOptions={fetchCounselorOptions}
              queryKey={['filters', 'payments', 'counselors']}
              onSelect={(v) => updateLocalFilter('counselor_id', v.length > 0 ? v.join(',') : null)}
            />

            <AppSelect
              label="Status"
              value={localFilters.status || undefined}
              options={PAYMENT_STATUS_OPTIONS}
              onSelect={(v) => updateLocalFilter('status', v ? String(v) : null)}
            />

            <View style={styles.footer}>
              <Pressable onPress={applyFilters} style={{ flex: 1 }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.applyBtn}
                >
                  <AppText style={styles.applyBtnText}>Apply Filters</AppText>
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
    maxHeight: '85%',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryLight + '10',
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
  applyBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  applyBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});
