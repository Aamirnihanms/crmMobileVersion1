import { useQuery } from '@tanstack/react-query';
import { fetchLeadById, fetchConvertedLeadById } from '../api/leads.api';

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

export const useConvertedLeadDetails = (
  id?: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ['converted-lead', id],
    queryFn: () => fetchConvertedLeadById(id as string),
    enabled: enabled && !!id,
  });
};
