import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPaginatedBatches, fetchBatchDetail, createBatch, updateBatch, deleteBatch, markBatchCompleted, fetchBatchSessions, createBatchSession, fetchBatchSessionDetail, updateBatchSession, deleteBatchSession, type BatchesPageResponse, type BatchesFilters } from '../api/batches.api';

export const useInfiniteBatches = (
  search: string,
  filters: BatchesFilters = {},
  options: any = {}
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
    ...options
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

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uid: string) => deleteBatch(uid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['batches-paginated'] });
    },
  });
};

export const useMarkBatchCompleted = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uid: string) => markBatchCompleted(uid),
    onSuccess: (_, uid) => {
      void queryClient.invalidateQueries({ queryKey: ['batch-detail', uid] });
      void queryClient.invalidateQueries({ queryKey: ['batches-paginated'] });
    },
  });
};

export const useBatchSessions = (batchId: string) => {
  return useQuery({
    queryKey: ['batch-sessions', batchId],
    queryFn: () => fetchBatchSessions(batchId),
    enabled: !!batchId,
  });
};

export const useCreateBatchSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBatchSession,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['batch-sessions', variables.batch] });
    },
  });
};

export const useBatchSessionDetail = (uid: string) => {
  return useQuery({
    queryKey: ['batch-session-detail', uid],
    queryFn: () => fetchBatchSessionDetail(uid),
    enabled: !!uid,
  });
};

export const useUpdateBatchSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, payload }: { uid: string; payload: any }) => updateBatchSession(uid, payload),
    onSuccess: (_, { uid }) => {
      void queryClient.invalidateQueries({ queryKey: ['batch-session-detail', uid] });
      void queryClient.invalidateQueries({ queryKey: ['batch-sessions'] });
    },
  });
};

export const useDeleteBatchSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, batchUid }: { uid: string; batchUid: string }) => deleteBatchSession(uid),
    onSuccess: (_, { batchUid }) => {
      void queryClient.invalidateQueries({ queryKey: ['batch-sessions', batchUid] });
    },
  });
};


