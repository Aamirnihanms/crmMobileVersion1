import { useQuery } from '@tanstack/react-query';
import { fetchCounselors } from '../../api/masters/counselors.api';

export const useCounselors = () =>
  useQuery({
    queryKey: ['masters', 'counselors'],
    queryFn: fetchCounselors,
    staleTime: Infinity,
    gcTime: Infinity,
  });
