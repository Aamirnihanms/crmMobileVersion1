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

import AppMultiSelect from '@/src/components/common/AppMultiSelect';
import AppText from '@/src/components/common/AppText';
import type { StudentFilters } from '@/src/api/students.api';
import type { MasterLocation } from '@/src/api/masters/locations.api';
import type { Batch } from '@/src/api/batches.api';
import type { Counselor } from '@/src/api/masters/counselors.api';
import type { Course } from '@/src/types/course';
import { colors, spacing } from '@/src/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: StudentFilters;
  setAllFilters: (filters: StudentFilters) => void;
  masters: {
    courses: Course[];
    counselors: Counselor[];
    batches: Batch[];
    locations: MasterLocation[];
  };
};

export default function StudentsFilterModal({
  visible,
  onClose,
  filters,
  setAllFilters,
  masters,
}: Props) {
  const [localFilters, setLocalFilters] =
    React.useState<StudentFilters>(filters || {});

  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters || {});
    }
  }, [visible, filters]);

  const updateLocalFilter = (
    key: keyof StudentFilters,
    value: string | null
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

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
              <AppText variant="caption" color={colors.textMuted}>
                Refine your students list
              </AppText>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={clearFilters}
                style={styles.clearBtn}
              >
                <AppText
                  variant="caption"
                  color={colors.primary}
                  style={{ fontWeight: '700' }}
                >
                  Clear All
                </AppText>
              </Pressable>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <AppMultiSelect
              label="Course"
              value={
                localFilters.course_id
                  ? localFilters.course_id.split(',')
                  : []
              }
              options={masters.courses.map((c) => ({
                label: c.course_name,
                value: c.id,
              }))}
              onSelect={(v) =>
                updateLocalFilter(
                  'course_id',
                  v.length > 0 ? v.join(',') : null
                )
              }
            />

            <AppMultiSelect
              label="Counselor"
              value={
                localFilters.counselor
                  ? localFilters.counselor.split(',')
                  : []
              }
              options={masters.counselors.map((c) => ({
                label: c.full_name,
                value: c.uid ?? c.id,
              }))}
              onSelect={(v) =>
                updateLocalFilter(
                  'counselor',
                  v.length > 0 ? v.join(',') : null
                )
              }
            />

            <AppMultiSelect
              label="Trainer"
              value={
                localFilters.trainer
                  ? localFilters.trainer.split(',')
                  : []
              }
              options={masters.counselors.map((c) => ({
                label: c.full_name,
                value: c.uid ?? c.id,
              }))}
              onSelect={(v) =>
                updateLocalFilter(
                  'trainer',
                  v.length > 0 ? v.join(',') : null
                )
              }
            />

            <AppMultiSelect
              label="Academic Counselor"
              value={
                localFilters.academic_counselor
                  ? localFilters.academic_counselor.split(',')
                  : []
              }
              options={masters.counselors.map((c) => ({
                label: c.full_name,
                value: c.uid ?? c.id,
              }))}
              onSelect={(v) =>
                updateLocalFilter(
                  'academic_counselor',
                  v.length > 0 ? v.join(',') : null
                )
              }
            />

            <AppMultiSelect
              label="Batch"
              value={
                localFilters.batch
                  ? localFilters.batch.split(',')
                  : []
              }
              options={masters.batches.map((b) => ({
                label: b.batch_name,
                value: b.uid,
              }))}
              onSelect={(v) =>
                updateLocalFilter(
                  'batch',
                  v.length > 0 ? v.join(',') : null
                )
              }
            />

            <AppMultiSelect
              label="Location"
              value={
                localFilters.location
                  ? localFilters.location.split(',')
                  : []
              }
              options={masters.locations.map((l) => ({
                label: l.name,
                value: l.value,
              }))}
              onSelect={(v) =>
                updateLocalFilter(
                  'location',
                  v.length > 0 ? v.join(',') : null
                )
              }
            />

            <View style={styles.footer}>
              <Pressable onPress={applyFilters} style={{ flex: 1 }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.applyBtn}
                >
                  <AppText style={styles.applyBtnText}>
                    Apply Filters
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
