import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import AppLoader from '@/src/components/common/AppLoader';
import StudentEnrollmentsSection from '@/src/components/students/StudentEnrollmentsSection';
import StudentHeader from '@/src/components/students/StudentHeader';
import StudentOverviewSection from '@/src/components/students/StudentOverviewSection';

import { StudentsStackParamList } from '@/src/navigation/StudentsStack';
import { useStudentProfile } from '@/src/queries/students.query';

import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<StudentsStackParamList, 'StudentDetails'>;

export default function StudentDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route: any = useRoute();
  const { id } = route.params;

  const { data, isLoading } = useStudentProfile(id);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('EditStudent', { id })}
          style={{ marginRight: 4, padding: 6 }}
        >
          <Ionicons
            name="create-outline"
            size={24}
            color={colors.primary}
          />
        </Pressable>
      ),
    });
  }, [navigation, id]);

  if (isLoading) return <AppLoader />;

  if (!data) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StudentHeader student={data} />

      <StudentOverviewSection
        student={data}
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