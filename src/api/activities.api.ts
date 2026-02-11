import { http } from './http';

export type LeadActivity = {
  id: string;
  title: string;
  description: string;
  time_since: string;
  activity_time: string;
  activity_type_details: {
    name: string;
    color: string;
    icon: string;
  };
performed_by_details: {
  full_name: string;
  email: string;
} | null;
performed_by_system: boolean;

};

export type LeadActivitiesPageResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    status: string;
    activities: LeadActivity[];
  };
};

export const fetchLeadActivities = async (
  leadId: string,
  page: number
): Promise<LeadActivitiesPageResponse> => {
  const res = await http.get(
    `/leads/${leadId}/activities/`,
    { params: { page } }
  );

  return res.data;
};
