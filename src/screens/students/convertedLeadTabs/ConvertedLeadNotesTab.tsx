import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import NoteCard from '@/src/components/notes/NoteCard';
import { useInfiniteLeadNotes } from '@/src/queries/notes.query';
import { colors, spacing } from '@/src/theme';

export default function ConvertedLeadNotesTab({ id }: { id: string }) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteLeadNotes(id);

  if (isLoading) return <AppLoader />;

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText style={{ marginTop: spacing.md }}>Failed to load notes</AppText>
      </View>
    );
  }

  const notes = data?.pages.flatMap((page) => page.results.notes) ?? [];

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      style={styles.container}
      renderItem={({ item }) => (
        // View-only: no long-press edit
        <NoteCard note={item} />
      )}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText variant="h2">Internal Notes</AppText>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="document-text-outline" size={32} color={colors.primary} />
          </View>
          <AppText variant="subtitle">No notes shared</AppText>
          <AppText color={colors.textMuted} style={styles.emptySubtext}>
            No internal notes were recorded for this lead.
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
