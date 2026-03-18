import { useQuery } from '@tanstack/react-query';
import { fetchLeadById } from '../api/leads.api';

export const useLeadDetails = (
  id?: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadById(id as string),
    enabled: enabled && !!id,
  });
};
