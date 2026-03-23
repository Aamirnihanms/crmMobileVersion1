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

import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';

import { colors, spacing } from '@/src/theme';

export default function LeadsFilterModal({
  visible,
  onClose,
  filters,
  updateFilter,
  masters,
}: any) {
  const clearFilters = () => {
    updateFilter('course', null);
    updateFilter('counselor', null);
    updateFilter('qualification', null);
    updateFilter('lead_status', null);
    updateFilter('lead_source', null);
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
            <AppSelect
              label="Course"
              value={filters.course}
              options={masters.courses.map((c: any) => ({
                label: c.course_name,
                value: c.id,
              }))}
              onSelect={(v) => updateFilter('course', v)}
            />

            <AppSelect
              label="Counselor"
              value={filters.counselor}
              options={masters.counselors.map((c: any) => ({
                label: c.full_name,
                value: c.id,
              }))}
              onSelect={(v) => updateFilter('counselor', v)}
            />

            <AppSelect
              label="Qualification"
              value={filters.qualification}
              options={masters.qualifications.map((q: any) => ({
                label: q.name,
                value: q.id,
              }))}
              onSelect={(v) => updateFilter('qualification', v)}
            />

            <AppSelect
              label="Lead Status"
              value={filters.lead_status}
              options={masters.statuses.map((s: any) => ({
                label: s.name,
                value: s.id,
              }))}
              onSelect={(v) => updateFilter('lead_status', v)}
            />

            <AppSelect
              label="Lead Source"
              value={filters.lead_source}
              options={masters.sources.map((s: any) => ({
                label: s.label,
                value: s.id,
              }))}
              onSelect={(v) => updateFilter('lead_source', v)}
            />

            <View style={styles.footer}>
              <Pressable onPress={onClose} style={{ flex: 1 }}>
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});