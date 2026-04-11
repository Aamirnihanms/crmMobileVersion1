import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createLeadFollowUp,
  fetchLeadFollowUps,
  updateFollowUpStatus,
  type CreateFollowUpPayload,
  type FollowUpImportance,
} from '../api/followups.api';

// Follow-ups
export const useInfiniteLeadFollowUps = (leadId: string) => {
  return useInfiniteQuery({
    queryKey: ['lead', leadId, 'followups'],
    initialPageParam: 1, // ✅ REQUIRED IN v5
    queryFn: ({ pageParam }) =>
      fetchLeadFollowUps(leadId, pageParam),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;

      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
  });
};

// Add follow-up
export const useAddFollowUp = (leadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreateFollowUpPayload, 'lead'>) =>
      createLeadFollowUp({
        ...payload,
        lead: leadId,
      }),

    onMutate: async (newFollowUp) => {
      await queryClient.cancelQueries({
        queryKey: ['lead', leadId, 'followups'],
      });

      const previous = queryClient.getQueryData<any>([
        'lead',
        leadId,
        'followups',
      ]);

      // Optimistic insert
      queryClient.setQueryData(
        ['lead', leadId, 'followups'],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any, index: number) =>
              index === 0
                ? {
                    ...page,
                    results: [
                      {
                        id: Date.now(),
                        notes: newFollowUp.notes,
                        next_follow_up_date:
                          newFollowUp.next_follow_up_date,
                        status: newFollowUp.status,
                        importance: newFollowUp.importance,
                        created_by: { full_name: 'You' },
                      },
                      ...page.results,
                    ],
                  }
                : page
            ),
          };
        }
      );

      return { previous };
    },

    onError: (_err, _new, context) => {
        console.error('Add follow-up failed:', _err);
      if (context?.previous) {
        queryClient.setQueryData(
          ['lead', leadId, 'followups'],
          context.previous
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['lead', leadId, 'followups'],
      });
    },
  });
};


// Update follow-up status
export type UpdateFollowUpPayload = {
  status: 'completed' | 'postponed' | 'canceled';
  lead: string;
  notes: string;
  importance: FollowUpImportance;
  next_follow_up_date: string;

  follow_up_methods?: ('phone' | 'whatsapp')[];
  call_duration?: string;
  whatsapp_message?: string;
  remark?: string;
};


export const useUpdateFollowUpStatus = (leadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      followupId,
      payload,
    }: {
      followupId: number;
      payload: UpdateFollowUpPayload;
    }) =>
      updateFollowUpStatus(followupId, payload),

    onSuccess: (data) => {
      const updatedFollowUp = data.followup;

      // 1️⃣ Optimistically update cache (best effort)
      queryClient.setQueryData(
        ['lead', leadId, 'followups'],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              results: page.results.map((f: any) =>
                f.id === updatedFollowUp.id
                  ? { ...f, ...updatedFollowUp }
                  : f
              ),
            })),
          };
        }
      );

      // 2️⃣ FORCE REACT QUERY TO RE-EVALUATE OBSERVERS (THIS IS KEY)
      queryClient.invalidateQueries({
        queryKey: ['lead', leadId, 'followups'],
      });
    },
  });
};
