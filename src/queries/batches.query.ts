import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPaginatedBatches, type BatchesPageResponse, type BatchesFilters } from '../api/batches.api';

export const useInfiniteBatches = (
  search: string,
  filters: BatchesFilters = {}
) => {
  return useInfiniteQuery({
    queryKey: ['batches-paginated', search, filters],
    initialPageParam: 1,

    queryFn: ({ pageParam }) =>
      fetchPaginatedBatches(pageParam, 10, search, filters),

    getNextPageParam: (lastPage: BatchesPageResponse) => {
      if (lastPage.pagination.current_page >= lastPage.pagination.total_pages) {
        return undefined;
      }
      return lastPage.pagination.current_page + 1;
    },
  });
};
