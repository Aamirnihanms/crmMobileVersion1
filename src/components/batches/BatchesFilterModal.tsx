import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

import type { BatchesFilters } from '@/src/api/batches.api';
import {
  fetchCounselorsPage,
  fetchCoursesPage,
  fetchLocationsPage,
} from '@/src/api/masters/paginatedMasters.api';
import AppMultiSelect from '@/src/components/common/AppMultiSelect';
import AppText from '@/src/components/common/AppText';

import { useAppTheme, spacing } from '@/src/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: BatchesFilters;
  setAllFilters: (filters: BatchesFilters) => void;
};

export default function BatchesFilterModal({
  visible,
  onClose,
  filters,
  setAllFilters,
}: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [localFilters, setLocalFilters] = React.useState<BatchesFilters>(filters || {});
  const [showStartDatePicker, setShowStartDatePicker] = React.useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = React.useState(false);

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
          value: item.id,
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const fetchLocationOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchLocationsPage({ page, pageSize, search });
      return {
        options: result.items.map((item) => ({
          label: item.name,
          value: item.id,
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const fetchUserOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchCounselorsPage({ page, pageSize, search });
      return {
        options: result.items.map((item) => ({
          label: item.full_name,
          value: item.uid || item.id, // Use UID if available as per example
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const clearFilters = () => {
    setLocalFilters({ inactive: true });
  };

  const applyFilters = () => {
    setAllFilters(localFilters);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Select Date';
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
              <AppText variant="caption" color={colors.textMuted}>Refine your batches list</AppText>
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
            <AppMultiSelect
              label="Location"
              value={localFilters.location_id ? localFilters.location_id.split(',') : []}
              options={[]}
              fetchOptions={fetchLocationOptions}
              queryKey={['filters', 'batches', 'locations']}
              onSelect={(v) => updateLocalFilter('location_id', v.length > 0 ? v.join(',') : null)}
            />

            <AppMultiSelect
              label="Course"
              value={localFilters.course_id ? localFilters.course_id.split(',') : []}
              options={[]}
              fetchOptions={fetchCourseOptions}
              queryKey={['filters', 'batches', 'courses']}
              onSelect={(v) => updateLocalFilter('course_id', v.length > 0 ? v.join(',') : null)}
            />

            <AppMultiSelect
              label="Trainers"
              value={localFilters.trainer_id ? localFilters.trainer_id.split(',') : []}
              options={[]}
              fetchOptions={fetchUserOptions}
              queryKey={['filters', 'batches', 'trainers']}
              onSelect={(v) => updateLocalFilter('trainer_id', v.length > 0 ? v.join(',') : null)}
            />

            <AppMultiSelect
              label="Academic Counselors"
              value={localFilters.counselor_id ? localFilters.counselor_id.split(',') : []}
              options={[]}
              fetchOptions={fetchUserOptions}
              queryKey={['filters', 'batches', 'counselors']}
              onSelect={(v) => updateLocalFilter('counselor_id', v.length > 0 ? v.join(',') : null)}
            />

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="caption" style={styles.label}>Date From</AppText>
                <Pressable style={styles.dateSelector} onPress={() => setShowStartDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <AppText style={styles.dateText}>{formatDate(localFilters.start_date_from)}</AppText>
                </Pressable>
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" style={styles.label}>Date To</AppText>
                <Pressable style={styles.dateSelector} onPress={() => setShowEndDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <AppText style={styles.dateText}>{formatDate(localFilters.start_date_to)}</AppText>
                </Pressable>
              </View>
            </View>

            {showStartDatePicker && (
              <DateTimePicker
                value={localFilters.start_date_from ? new Date(localFilters.start_date_from) : new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowStartDatePicker(false);
                  if (date) updateLocalFilter('start_date_from', date.toISOString().split('T')[0]);
                }}
              />
            )}

            {showEndDatePicker && (
              <DateTimePicker
                value={localFilters.start_date_to ? new Date(localFilters.start_date_to) : new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowEndDatePicker(false);
                  if (date) updateLocalFilter('start_date_to', date.toISOString().split('T')[0]);
                }}
              />
            )}

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
  label: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    borderRadius: 12,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 48,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
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
