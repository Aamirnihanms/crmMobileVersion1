import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import React from 'react';

import AppLoader from '../../../components/common/AppLoader';
import AppText from '../../../components/common/AppText';
import NoteCard from '../../../components/notes/NoteCard';
import { spacing } from '../../../theme';
import { useInfiniteLeadNotes } from '../../../queries/notes.query';


import AddEditNoteModal from '../../../components/notes/AddEditNoteModal';
import {
  useCreateNote,
  useUpdateNote,
} from '../../../queries/notes.query';
import type { LeadNote } from '../../../api/notes.api';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';


export default function LeadNotesTab({ id }: { id: string }) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteLeadNotes(id);

  const [open, setOpen] = React.useState(false);
const [editingNote, setEditingNote] =
  React.useState<LeadNote | null>(null);

const createNote = useCreateNote(id);
const updateNote = useUpdateNote(id);


  if (isLoading) return <AppLoader />;

  if (isError) {
    return (
      <View style={styles.center}>
        <AppText>Failed to load notes</AppText>
      </View>
    );
  }

  const notes =
    data?.pages.flatMap(
      (page) => page.results.notes
    ) ?? [];

  if (!notes.length) {
    return (
      <View style={styles.center}>
        <AppText>No notes yet</AppText>
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
      data={notes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
renderItem={({ item }) => (
  <Pressable onLongPress={() => setEditingNote(item)}>
    <NoteCard note={item} />
  </Pressable>
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
    <AddEditNoteModal
  visible={open || !!editingNote}
  initialContent={editingNote?.content}
  initialImportance={editingNote?.importance}
  onClose={() => {
    setOpen(false);
    setEditingNote(null);
  }}
  onSubmit={(payload) => {
    if (editingNote) {
      updateNote.mutate({
        noteId: editingNote.id,
        payload,
      });
    } else {
      createNote.mutate(payload);
    }

    setOpen(false);
    setEditingNote(null);
  }}
/>

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
