import { Ionicons } from '@expo/vector-icons';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import StudentActivityCard from '@/src/components/students/StudentActivityCard';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import { useInfiniteStudentActivities } from '@/src/queries/studentActivities.query';
import { useAppTheme, spacing } from '@/src/theme';

export default function StudentActivityTab({ studentId }: { studentId: string }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteStudentActivities(studentId);

  if (isLoading) return <AppLoader />;

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText style={{ marginTop: spacing.md }}>
          Failed to load activities
        </AppText>
      </View>
    );
  }

  const activities = data?.pages.flatMap((page) => page.results) ?? [];

  if (!activities.length) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="analytics-outline" size={32} color={colors.primary} />
        </View>
        <AppText variant="subtitle">No activity yet</AppText>
        <AppText color={colors.textMuted} style={styles.emptySubtext}>
          No activity was recorded for this student.
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.uid}
      contentContainerStyle={styles.list}
      style={styles.container}
      renderItem={({ item }) => <StudentActivityCard activity={item} />}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={isFetchingNextPage ? <AppLoader /> : null}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    />
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  },
});
