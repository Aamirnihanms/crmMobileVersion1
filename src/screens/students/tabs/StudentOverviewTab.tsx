import { ScrollView, StyleSheet } from 'react-native';
import StudentOverviewSection from '@/src/components/students/StudentOverviewSection';
import { colors, spacing } from '@/src/theme';

export default function StudentOverviewTab({ student }: { student: any }) {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StudentOverviewSection student={student} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
  },
});
