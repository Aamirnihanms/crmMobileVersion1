import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAttendanceList, AttendanceFilters, AttendanceListResponse, updateAttendance, UpdateAttendancePayload } from '@/src/api/attendance.api';

export const attendanceKeys = {
  all: ['attendance'] as const,
  lists: () => [...attendanceKeys.all, 'list'] as const,
  list: (filters: AttendanceFilters) => [...attendanceKeys.lists(), filters] as const,
};

export const useAttendanceList = (filters: AttendanceFilters, enabled: boolean = true) => {
  return useQuery<AttendanceListResponse>({
    queryKey: attendanceKeys.list(filters),
    queryFn: () => fetchAttendanceList(filters),
    enabled: !!filters.batch_id && enabled,
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAttendancePayload) => updateAttendance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      });
    },
  });
};
