import { http } from '../http';
import type { LeadSource } from '../../types/leadSource';

type LeadSourcesResponse = {
  status: string;
  sources: LeadSource[];
};

export const fetchLeadSources = async (): Promise<LeadSource[]> => {
  const res = await http.get<LeadSourcesResponse>('/lead/sources/');
  return res.data.sources;
};
