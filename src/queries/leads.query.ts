import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchLeads,
  createLead,
  updateLead,
  type LeadsFilters,
} from '../api/leads.api';

export const useInfiniteLeads = (
  search: string,
  filters?: LeadsFilters
) => {
  return useInfiniteQuery({
    queryKey: ['leads', search, filters], // 🔥 VERY IMPORTANT
    initialPageParam: 1,

    queryFn: ({ pageParam }) =>
      fetchLeads(pageParam, 5, search, filters),

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

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: any;
    }) => updateLead(id, payload),

    onSuccess: (_data, variables) => {
      console.log('🎉 Lead updated:', variables.id);

      queryClient.invalidateQueries({
        queryKey: ['leads'],
      });

      queryClient.invalidateQueries({
        queryKey: ['lead', variables.id],
      });
    },

    onError: (error: any) => {
      console.log('🚨 Update lead failed:', error?.response?.data || error);
    },
  });
};
