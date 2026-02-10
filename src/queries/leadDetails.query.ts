import { useQuery } from '@tanstack/react-query';
import { fetchLeadById } from '../api/leads.api';

export const useLeadDetails = (id: string) => {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadById(id),
  });
};
