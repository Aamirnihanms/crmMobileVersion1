import { ScrollView, StyleSheet } from 'react-native';
import StudentEnrollmentsSection from '@/src/components/students/StudentEnrollmentsSection';
import { colors, spacing } from '@/src/theme';

export default function StudentEnrollmentsTab({
  student,
}: {
  student: any;
}) {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StudentEnrollmentsSection
        enrollments={student?.enrollments ?? []}
        studentId={student?.student_id}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
