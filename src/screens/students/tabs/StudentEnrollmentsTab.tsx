import { ScrollView, StyleSheet } from 'react-native';
import StudentEnrollmentsSection from '@/src/components/students/StudentEnrollmentsSection';
import { useAppTheme, spacing } from '@/src/theme';

export default function StudentEnrollmentsTab({
  student,
}: {
  student: any;
}) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
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

const getStyles = (colors: any) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
