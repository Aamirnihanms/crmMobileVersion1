import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';

import AppSelect from '@/src/components/common/AppSelect';
import AppButton from '@/src/components/common/AppButton';
import AppText from '@/src/components/common/AppText';

import { spacing, colors } from '@/src/theme';

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
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1 }}>
        {/* ---------- HEADER ---------- */}

        <View style={styles.header}>
          <AppText variant="title">Filters</AppText>

          <AppText
            color={colors.primary}
            onPress={clearFilters}
          >
            Clear
          </AppText>
        </View>

        {/* ---------- BODY ---------- */}

        <ScrollView contentContainerStyle={styles.container}>
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
        </ScrollView>

        {/* ---------- FOOTER ---------- */}

        <View style={styles.footer}>
          <AppButton title="Apply Filters" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    borderTopWidth: 1,
    borderColor: '#eee',
  },
});