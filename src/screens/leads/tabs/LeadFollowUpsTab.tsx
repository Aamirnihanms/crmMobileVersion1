import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import type { FollowUp } from '../../../api/followups.api';
import AppLoader from '../../../components/common/AppLoader';
import AppText from '../../../components/common/AppText';
import AddFollowUpModal from '../../../components/followups/AddFollowUpModal';
import FollowUpCard from '../../../components/followups/FollowUpCard';
import UpdateFollowUpStatusModal from '../../../components/followups/UpdateFollowUpStatusModal';
import { useAddFollowUp, useInfiniteLeadFollowUps, useUpdateFollowUpStatus } from '../../../queries/followups.query';
import { colors, spacing } from '../../../theme';

export default function LeadFollowUpsTab({ id }: { id: string }) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteLeadFollowUps(id);

  const [open, setOpen] = React.useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = React.useState<FollowUp | null>(null);

  const addFollowUp = useAddFollowUp(id);
  const updateStatus = useUpdateFollowUpStatus(id);

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
    <View style={styles.container}>
      <FlatList
        data={followUps}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <FollowUpCard
            followup={item}
            onUpdateStatus={() => setSelectedFollowUp(item)}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="h2">Follow-ups</AppText>
            <Pressable onPress={() => setOpen(true)}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <AppText style={styles.addText}>New</AppText>
              </LinearGradient>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={32} color={colors.primary} />
            </View>
            <AppText variant="subtitle">No Follow-ups yet</AppText>
            <AppText color={colors.textMuted} style={styles.emptySubtext}>
              Keep track of your scheduled follow-ups here.
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

      <AddFollowUpModal
        visible={open}
        onClose={() => setOpen(false)}
        onSubmit={(data) => {
          addFollowUp.mutate({
            notes: data.notes,
            next_follow_up_date: data.next_follow_up_date,
            importance: data.importance,
            status: 'pending',
          });
          setOpen(false);
        }}
      />

      {selectedFollowUp && (
        <UpdateFollowUpStatusModal
          visible={true}
          followup={selectedFollowUp}
          leadId={id}
          onClose={() => setSelectedFollowUp(null)}
          onSubmit={(payload) => {
            updateStatus.mutate({
              followupId: selectedFollowUp.id,
              payload,
            });
            setSelectedFollowUp(null);
          }}
        />
      )}
    </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
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
