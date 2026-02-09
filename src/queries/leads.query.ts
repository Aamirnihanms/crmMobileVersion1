import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchLeads, LeadsPageResponse } from '../api/leads.api';

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
