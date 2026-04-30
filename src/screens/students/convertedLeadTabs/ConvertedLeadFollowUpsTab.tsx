import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import FollowUpCard from '@/src/components/followups/FollowUpCard';
import { useInfiniteLeadFollowUps } from '@/src/queries/followups.query';
import { colors, spacing } from '@/src/theme';

// Follow-ups use the generic /followups/?lead=id endpoint,
// which works with converted-lead IDs directly.
export default function ConvertedLeadFollowUpsTab({ id }: { id: string }) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteLeadFollowUps(id);

  if (isLoading) return <AppLoader />;

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText style={{ marginTop: spacing.md }}>Failed to load follow-ups</AppText>
      </View>
    );
  }

  const followUps = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <FlatList
      data={followUps}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.list}
      style={styles.container}
      renderItem={({ item }) => (
        <FollowUpCard followup={item} isViewOnly />
      )}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText variant="h2">Follow-ups</AppText>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-outline" size={32} color={colors.primary} />
          </View>
          <AppText variant="subtitle">No Follow-ups</AppText>
          <AppText color={colors.textMuted} style={styles.emptySubtext}>
            No follow-ups were recorded for this lead.
          </AppText>
        </View>
      }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
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
