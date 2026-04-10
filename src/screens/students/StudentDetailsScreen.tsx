import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
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

  const { data, isLoading, isError, error, refetch } = useStudentProfile(id);

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

  if (isError) {
    const errorDetail = (error as any)?.response?.data?.detail;
    const errorMessage = (error as any)?.response?.data?.error;
    const fallbackMessage = (error as Error)?.message || 'Failed to load student details';
    
    // Display detail if available, otherwise specific error, otherwise generic message
    const displayMessage = errorDetail || errorMessage || fallbackMessage;

    return (
      <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={{ marginTop: spacing.md, textAlign: 'center', fontWeight: '600' }}>
          {displayMessage}
        </AppText>
        <Pressable onPress={() => refetch()} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12, backgroundColor: colors.primaryLight + '15' }}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

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