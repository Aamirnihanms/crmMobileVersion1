import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import StudentHeader from '@/src/components/students/StudentHeader';
import StudentDetailsTabs from '@/src/navigation/StudentDetailsTabs';

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

  const droppedEnrollments =
    data?.enrollments?.filter((e: any) => e.status_object?.value === 'dropped') || [];
  const hasDropped = droppedEnrollments.length > 0;

  useLayoutEffect(() => {
    const handleEnrollAction = () => {
      if (!data) return;
      if (hasDropped) {
        navigation.navigate('RejoinStudent', {
          student: { ...data, dropped_enrollments: droppedEnrollments },
        });
      } else {
        navigation.navigate('NewEnrollment', {
          studentId: data.student_id,
          studentName: data.full_name,
        });
      }
    };

    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerBtns}>
          {/* View History — only if converted from a lead */}
          {data?.converted_from_lead && (
            <Pressable
              style={({ pressed }) => [styles.hBtn, pressed && styles.hBtnPressed]}
              onPress={() =>
                navigation.navigate('ConvertedLeadHistory', {
                  leadId: data.converted_from_lead,
                })
              }
            >
              <Ionicons name="time-outline" size={22} color={colors.primary} />
            </Pressable>
          )}

          {/* New Enrollment / Rejoin */}
          {data && (
            <Pressable
              style={({ pressed }) => [styles.hBtn, pressed && styles.hBtnPressed]}
              onPress={handleEnrollAction}
            >
              <Ionicons
                name={hasDropped ? 'refresh-circle-outline' : 'add-circle-outline'}
                size={22}
                color={hasDropped ? colors.danger : colors.primary}
              />
            </Pressable>
          )}

          {/* Edit */}
          <Pressable
            style={({ pressed }) => [styles.hBtn, pressed && styles.hBtnPressed]}
            onPress={() => navigation.navigate('EditStudent', { id })}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, id, data, hasDropped]);

  if (isLoading) return <AppLoader />;

  if (isError) {
    const errorDetail = (error as any)?.response?.data?.detail;
    const errorMessage = (error as any)?.response?.data?.error;
    const fallback = (error as Error)?.message || 'Failed to load student details';
    const displayMessage = errorDetail || errorMessage || fallback;

    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={styles.errorText}>
          {displayMessage}
        </AppText>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <AppText color={colors.primary} style={{ fontWeight: '700' }}>
            Try Again
          </AppText>
        </Pressable>
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={styles.screen}>
      {/* ── Compact sticky header ── */}
      <View style={styles.headerWrapper}>
        <StudentHeader student={data} />
      </View>

      {/* ── Tabs fill rest ── */}
      <View style={styles.tabsWrapper}>
        <StudentDetailsTabs student={data} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  tabsWrapper: {
    flex: 1,
  },
  headerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 4,
  },
  hBtn: {
    padding: 6,
    borderRadius: 8,
  },
  hBtnPressed: {
    backgroundColor: colors.primary + '15',
    opacity: 0.75,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
  },
});