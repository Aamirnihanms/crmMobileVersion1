import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBatchChangeRequests, BatchChangeRequestFilters, fetchBatchChangeRequestDetail, approveBatchChangeRequest, ApproveBatchChangeRequestPayload, createBatchChangeRequest, CreateBatchChangeRequestPayload } from '../api/batch-change.api';

export const useBatchChangeRequests = (filters: BatchChangeRequestFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['batch-change-requests', filters],
    queryFn: ({ pageParam = 1 }) => fetchBatchChangeRequests(pageParam, 10, filters),
    getNextPageParam: (lastPage) => {
      if (lastPage.data.pagination.has_next) {
        return lastPage.data.pagination.next_page;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useBatchChangeRequestDetail = (uid: string) => {
  return useQuery({
    queryKey: ['batch-change-request-detail', uid],
    queryFn: () => fetchBatchChangeRequestDetail(uid),
    enabled: !!uid,
  });
};

export const useApproveBatchChangeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, payload }: { uid: string; payload: ApproveBatchChangeRequestPayload }) => 
      approveBatchChangeRequest(uid, payload),
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['batch-change-request-detail', uid] });
      queryClient.invalidateQueries({ queryKey: ['batch-change-requests'] });
    },
  });
};

export const useCreateBatchChangeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: CreateBatchChangeRequestPayload }) =>
      createBatchChangeRequest(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-change-requests'] });
    },
  });
};
