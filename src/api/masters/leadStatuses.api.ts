import { http } from '../http';
import type { LeadStatus } from '../../types/leadStatus';

type LeadStatusesResponse = {
  status: string;
  statuses: LeadStatus[];
};

export const fetchLeadStatuses = async (): Promise<LeadStatus[]> => {
  const res = await http.get<LeadStatusesResponse>(
    '/lead/statuses/'
  );

  return res.data.statuses;
};
