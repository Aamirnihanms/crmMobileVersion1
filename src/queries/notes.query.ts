import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchLeadNotes } from '../api/notes.api';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createLeadNote,
  updateLeadNote,
  CreateNotePayload,
} from '../api/notes.api';

export const useInfiniteLeadNotes = (leadId: string) => {
  return useInfiniteQuery({
    queryKey: ['lead', leadId, 'notes'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchLeadNotes(leadId, pageParam),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;

      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
  });
};


// create note
export const useCreateNote = (leadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNotePayload) =>
      createLeadNote(leadId, payload),

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['lead', leadId, 'notes'],
      });
    },
  });
};

export const useUpdateNote = (leadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      payload,
    }: {
      noteId: string;
      payload: CreateNotePayload;
    }) =>
      updateLeadNote(noteId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['lead', leadId, 'notes'],
      });
    },
  });
};