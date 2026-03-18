import { View, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';


import AppLoader from '@/src/components/common/AppLoader';
import StudentHeader from '@/src/components/students/StudentHeader';
import StudentOverviewSection from '@/src/components/students/StudentOverviewSection';
import StudentEnrollmentsSection from '@/src/components/students/StudentEnrollmentsSection';



import { useStudentProfile } from '@/src/queries/students.query';

import { spacing } from '@/src/theme';
import { useNavigation } from '@/.expo/types/router';




export default function StudentDetailsScreen() {

 
  const route: any = useRoute();
  const { id } = route.params;

  const { data, isLoading } = useStudentProfile(id);
 

  if (isLoading) return <AppLoader />;

  if (!data) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StudentHeader student={data} />

      <StudentOverviewSection
        dashboard={data.dashboard_data}
      />

      <StudentEnrollmentsSection
        enrollments={data.enrollments}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
});