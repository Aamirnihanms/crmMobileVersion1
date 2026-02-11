import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchLeads, LeadsPageResponse } from '../api/leads.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLead } from '../api/leads.api';

export const useInfiniteLeads = (search: string) => {
  return useInfiniteQuery<
    LeadsPageResponse,
    Error,
    LeadsPageResponse,
    ['leads', string],
    number
  >({
    queryKey: ['leads', search], // 🔥 VERY IMPORTANT
    initialPageParam: 1,

    queryFn: ({ pageParam }) =>
      fetchLeads(pageParam, 5, search),

    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined;
      return allPages.length + 1;
    },
  });
};


// Mutation for creating a lead
export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLead,

    onSuccess: (data) => {
      console.log('🎉 Lead created:', data);

      queryClient.invalidateQueries({
        queryKey: ['leads'],
      });
    },

    onError: (error: any) => {
      console.log('🚨 Create lead failed:', error?.response?.data || error);
    },
  });
};

