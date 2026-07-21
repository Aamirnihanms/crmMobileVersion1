import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AttendanceFilters } from '@/src/api/attendance.api';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { useAppTheme, spacing } from '@/src/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: AttendanceFilters;
  onApply: (filters: AttendanceFilters) => void;
};

export default function AttendanceFilterModal({
  visible,
  onClose,
  filters,
  onApply,
}: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [localFilters, setLocalFilters] = useState<AttendanceFilters>(filters);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const updateLocalFilter = (key: keyof AttendanceFilters, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setLocalFilters({ batch_id: filters.batch_id });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Select Date';
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Online', value: 'online' },
    { label: 'Offline', value: 'offline' },
    { label: 'Absent', value: 'absent' },
  ];

  return (
    <Modal statusBarTranslucent navigationBarTranslucent visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.indicator} />

          <View style={styles.header}>
            <View>
              <AppText variant="h2">Filter Attendance</AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Narrow down records by status or date
              </AppText>
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
            <View style={styles.section}>
              <AppSelect
                label="Attendance Status"
                value={localFilters.attendance_status || ''}
                options={statusOptions}
                onSelect={(v) => updateLocalFilter('attendance_status', v)}
              />
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <AppText style={styles.label}>Start Date</AppText>
                <Pressable style={styles.dateSelector} onPress={() => setShowStartDate(true)}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <AppText style={styles.dateText}>{formatDate(localFilters.start_date)}</AppText>
                </Pressable>
              </View>
              <View style={{ width: spacing.md }} />
              <View style={styles.dateCol}>
                <AppText style={styles.label}>End Date</AppText>
                <Pressable style={styles.dateSelector} onPress={() => setShowEndDate(true)}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <AppText style={styles.dateText}>{formatDate(localFilters.end_date)}</AppText>
                </Pressable>
              </View>
            </View>

            {showStartDate && (
              <DateTimePicker
                value={localFilters.start_date ? new Date(localFilters.start_date) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowStartDate(false);
                  if (date) updateLocalFilter('start_date', date.toISOString().split('T')[0]);
                }}
              />
            )}

            {showEndDate && (
              <DateTimePicker
                value={localFilters.end_date ? new Date(localFilters.end_date) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowEndDate(false);
                  if (date) updateLocalFilter('end_date', date.toISOString().split('T')[0]);
                }}
              />
            )}

            <View style={styles.footer}>
              <Pressable onPress={handleApply} style={{ flex: 1 }}>
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
    maxHeight: '80%',
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
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  dateCol: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footer: {
    marginTop: spacing.md,
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
