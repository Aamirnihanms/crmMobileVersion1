import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import ActivityCard from '../../../components/activities/ActivityCard';
import AppLoader from '../../../components/common/AppLoader';
import AppText from '../../../components/common/AppText';
import { useInfiniteLeadActivities } from '../../../queries/activities.query';
import { colors, spacing } from '@/src/theme';

export default function LeadActivitiesTab({
  id,
}: {
  id: string;
}) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteLeadActivities(id);

  if (isLoading) return <AppLoader />;

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText style={{ marginTop: spacing.md }}>Failed to load activities</AppText>
      </View>
    );
  }

  const activities =
    data?.pages.flatMap(
      (page) => page.results.activities
    ) ?? [];

  if (!activities.length) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="analytics-outline" size={32} color={colors.primary} />
        </View>
        <AppText variant="subtitle">No activity yet</AppText>
        <AppText color={colors.textMuted} style={styles.emptySubtext}>
          Recent movements and updates will appear here.
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      style={styles.container}
      renderItem={({ item }) => (
        <ActivityCard activity={item} />
      )}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingNextPage ? <AppLoader /> : null
      }
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

const styles = StyleSheet.create({
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
