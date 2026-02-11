import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import AppLoader from '../../../components/common/AppLoader';
import AppText from '../../../components/common/AppText';
import ActivityCard from '../../../components/activities/ActivityCard';
import { spacing } from '../../../theme';
import { useInfiniteLeadActivities } from '../../../queries/activities.query';

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
        <AppText>Failed to load activities</AppText>
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
        <AppText>No activity yet</AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
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
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
