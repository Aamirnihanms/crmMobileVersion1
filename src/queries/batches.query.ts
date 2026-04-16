import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPaginatedBatches, fetchBatchDetail, createBatch, updateBatch, type BatchesPageResponse, type BatchesFilters } from '../api/batches.api';

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

export const useBatchDetail = (uid: string) => {
  return useQuery({
    queryKey: ['batch-detail', uid],
    queryFn: () => fetchBatchDetail(uid),
    enabled: !!uid,
  });
};

export const useCreateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['batches-paginated'] });
    },
  });
};

export const useUpdateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, payload }: { uid: string; payload: any }) => updateBatch(uid, payload),
    onSuccess: (_, { uid }) => {
      void queryClient.invalidateQueries({ queryKey: ['batch-detail', uid] });
      void queryClient.invalidateQueries({ queryKey: ['batches-paginated'] });
    },
  });
};


