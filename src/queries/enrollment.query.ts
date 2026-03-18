import { useQuery } from '@tanstack/react-query';
import { fetchEnrollmentById } from '../api/enrollment.api';

export const useEnrollmentDetails = (id: string) => {
  return useQuery({
    queryKey: ['enrollment', id],
    queryFn: () => fetchEnrollmentById(id),
    enabled: !!id,
  });
};