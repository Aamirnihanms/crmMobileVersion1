import { useQuery } from '@tanstack/react-query';
import { fetchLeadStatuses } from '../../api/masters/leadStatuses.api';
import type { LeadStatus } from '../../types/leadStatus';

export const useLeadStatuses = () =>
  useQuery<LeadStatus[]>({
    queryKey: ['masters', 'lead-statuses'],
    queryFn: fetchLeadStatuses,
    staleTime: Infinity,
    gcTime: Infinity,
  });
