import { useQuery } from '@tanstack/react-query';
import { fetchLeadSources } from '../../api/masters/leadSources.api';
import type { LeadSource } from '../../types/leadSource';

export const useLeadSources = () =>
  useQuery<LeadSource[]>({
    queryKey: ['masters', 'lead-sources'],
    queryFn: fetchLeadSources,
    staleTime: Infinity,
    gcTime: Infinity, // React Query v5
  });
  