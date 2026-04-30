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

import type { LeadsFilters } from '@/src/api/leads.api';
import {
  fetchCounselorsPage,
  fetchCoursesPage,
  fetchLeadSourcesPage,
  fetchLeadStatusesPage,
  fetchQualificationsPage,
} from '@/src/api/masters/paginatedMasters.api';
import AppMultiSelect from '@/src/components/common/AppMultiSelect';
import AppText from '@/src/components/common/AppText';

import { colors, spacing } from '@/src/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: LeadsFilters;
  setAllFilters: (filters: LeadsFilters) => void;
};

export default function LeadsFilterModal({
  visible,
  onClose,
  filters,
  setAllFilters,
}: Props) {
  const [localFilters, setLocalFilters] = React.useState<LeadsFilters>(filters || {});

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

  const fetchCounselorOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchCounselorsPage({ page, pageSize, search });
      return {
        options: result.items.map((item) => ({
          label: item.full_name,
          value: item.id,
        })),
        hasNextPage: result.hasNextPage,
      };
    },
    []
  );

  const fetchQualificationOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchQualificationsPage({ page, pageSize, search });
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

  const fetchLeadStatusOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchLeadStatusesPage({ page, pageSize, search });
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

  const fetchLeadSourceOptions = React.useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
      const result = await fetchLeadSourcesPage({ page, pageSize, search });
      return {
        options: result.items.map((item) => ({
          label: item.label,
          value: item.id,
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
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.indicator} />

          <View style={styles.header}>
            <View>
              <AppText variant="h2">Filters</AppText>
              <AppText variant="caption" color={colors.textMuted}>Refine your leads list</AppText>
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
              label="Course"
              value={localFilters.course ? localFilters.course.split(',') : []}
              options={[]}
              fetchOptions={fetchCourseOptions}
              queryKey={['filters', 'leads', 'courses']}
              onSelect={(v) => updateLocalFilter('course', v.length > 0 ? v.join(',') : null)}
            />

            <AppMultiSelect
              label="Counselor"
              value={localFilters.counselor ? localFilters.counselor.split(',') : []}
              options={[]}
              fetchOptions={fetchCounselorOptions}
              queryKey={['filters', 'leads', 'counselors']}
              onSelect={(v) => updateLocalFilter('counselor', v.length > 0 ? v.join(',') : null)}
            />

            <AppMultiSelect
              label="Qualification"
              value={localFilters.qualification ? localFilters.qualification.split(',') : []}
              options={[]}
              fetchOptions={fetchQualificationOptions}
              queryKey={['filters', 'leads', 'qualifications']}
              onSelect={(v) => updateLocalFilter('qualification', v.length > 0 ? v.join(',') : null)}
            />

            <AppMultiSelect
              label="Lead Status"
              value={localFilters.lead_status ? localFilters.lead_status.split(',') : []}
              options={[]}
              fetchOptions={fetchLeadStatusOptions}
              queryKey={['filters', 'leads', 'statuses']}
              onSelect={(v) => updateLocalFilter('lead_status', v.length > 0 ? v.join(',') : null)}
            />

            <AppMultiSelect
              label="Lead Source"
              value={localFilters.lead_source ? localFilters.lead_source.split(',') : []}
              options={[]}
              fetchOptions={fetchLeadSourceOptions}
              queryKey={['filters', 'leads', 'sources']}
              onSelect={(v) => updateLocalFilter('lead_source', v.length > 0 ? v.join(',') : null)}
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
