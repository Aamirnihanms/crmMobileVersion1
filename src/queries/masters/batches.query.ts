import { useQuery } from '@tanstack/react-query';
import { fetchBatches } from '@/src/api/batches.api';

export const useBatches = (courseId?: number, enabled = true) => {
  return useQuery({
    queryKey: ['batches', courseId], // 🔥 cache per course
    queryFn: () => fetchBatches(courseId),
    enabled: enabled && Boolean(courseId),
    staleTime: 1000 * 60 * 5,
  });
};
