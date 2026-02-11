import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import React from 'react';

import AppLoader from '../../../components/common/AppLoader';
import AppText from '../../../components/common/AppText';
import FollowUpCard from '../../../components/followups/FollowUpCard';
import { spacing } from '../../../theme';
import { useInfiniteLeadFollowUps } from '../../../queries/followups.query';

import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddFollowUpModal from '../../../components/followups/AddFollowUpModal';
import { useAddFollowUp } from '../../../queries/followups.query';

import { colors } from '../../../theme';

import UpdateFollowUpStatusModal from '../../../components/followups/UpdateFollowUpStatusModal';
import { useUpdateFollowUpStatus } from '../../../queries/followups.query';
import type { FollowUp } from '../../../api/followups.api';



export default function LeadFollowUpsTab({ id }: { id: string }) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteLeadFollowUps(id);

  const [open, setOpen] = React.useState(false);
const addFollowUp = useAddFollowUp(id);

const [selectedFollowUp, setSelectedFollowUp] =
  React.useState<FollowUp | null>(null);

const updateStatus = useUpdateFollowUpStatus(id);



  if (isLoading) return <AppLoader />;

  if (isError) {
    return (
        console.error('Error fetching follow-ups:', error),
      <View style={styles.center}>
        <AppText>Failed to load follow-ups</AppText>
      </View>
    );
  }

  const followUps =
    data?.pages.flatMap((page) => page.results) ?? [];

  if (!followUps.length) {
    return (
      <View style={styles.center}>
        <AppText>No follow-ups yet</AppText>
      </View>
    );
  }

  return (
    <>
    <Pressable
  style={{ alignSelf: 'flex-end', margin: spacing.md }}
  onPress={() => setOpen(true)}
>
  <Ionicons name="add-circle" size={28} color={colors.primary} />
</Pressable>

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

    </>
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
