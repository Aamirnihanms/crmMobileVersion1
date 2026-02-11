import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchLeadActivities } from '../api/activities.api';

export const useInfiniteLeadActivities = (leadId: string) => {
  return useInfiniteQuery({
    queryKey: ['lead', leadId, 'activities'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchLeadActivities(leadId, pageParam),

    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;

      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
  });
};
