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

import { colors, spacing } from '@/src/theme';
import type { LeadNote } from '../../../api/notes.api';
import AppLoader from '../../../components/common/AppLoader';
import AppText from '../../../components/common/AppText';
import AddEditNoteModal from '../../../components/notes/AddEditNoteModal';
import NoteCard from '../../../components/notes/NoteCard';
import { useCreateNote, useInfiniteLeadNotes, useUpdateNote } from '../../../queries/notes.query';

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
  const [editingNote, setEditingNote] = React.useState<LeadNote | null>(null);

  const createNote = useCreateNote(id);
  const updateNote = useUpdateNote(id);

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
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onEdit={() => setEditingNote(item)}
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
            <AppText variant="h2">Internal Notes</AppText>
            <Pressable
              onPress={() => setOpen(true)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color={colors.surface} />
                <AppText style={styles.addText}>New</AppText>
              </LinearGradient>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={32} color={colors.primary} />
            </View>
            <AppText variant="subtitle">No notes shared yet</AppText>
            <AppText color={colors.textMuted} style={styles.emptySubtext}>
              Keep internal observations and remarks here.
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

      <AddEditNoteModal
        visible={open || !!editingNote}
        initialContent={editingNote?.content}
        initialImportance={editingNote?.importance}
        loading={createNote.isPending || updateNote.isPending}
        onClose={() => {
          setOpen(false);
          setEditingNote(null);
        }}
        onSubmit={(payload) => {
          if (editingNote) {
            updateNote.mutate(
              {
                noteId: editingNote.id,
                payload,
              },
              {
                onSuccess: () => {
                  setOpen(false);
                  setEditingNote(null);
                },
              }
            );
          } else {
            createNote.mutate(payload, {
              onSuccess: () => {
                setOpen(false);
                setEditingNote(null);
              },
            });
          }
        }}
      />
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
    color: colors.surface,
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
