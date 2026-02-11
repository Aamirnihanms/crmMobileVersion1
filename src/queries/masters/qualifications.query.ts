import { useQuery } from '@tanstack/react-query';
import { fetchQualifications } from '../../api/masters/qualifications.api';
import type { Qualification } from '../../types/qualification';

export const useQualifications = () =>
  useQuery<Qualification[]>({
    queryKey: ['masters', 'qualifications'],
    queryFn: fetchQualifications,
    staleTime: Infinity,
    gcTime: Infinity,
    select: (data) =>
      data
        .filter(q => q.is_active)
        .sort((a, b) => a.index - b.index),
  });
