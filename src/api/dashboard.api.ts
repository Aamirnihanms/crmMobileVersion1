import { http } from './http';

export type DashboardTimeframe = {
  selected?: string;
  start_date?: string;
  end_date?: string;
  display_name?: string;
};

export type DashboardUserInfo = {
  name?: string;
  email?: string;
  role?: string;
};

export type DashboardData = {
  timeframe?: DashboardTimeframe;
  user_info?: DashboardUserInfo;
  [key: string]: unknown;
};

export type DashboardResponse = {
  status: string;
  data: DashboardData;
  generated_at?: string;
};

export type DashboardTimeframeParam =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'this_year';

type DashboardParams = {
  timeframe?: DashboardTimeframeParam;
};

export const fetchSuperadminDashboard = async (params?: DashboardParams): Promise<DashboardResponse> => {
  const res = await http.get<DashboardResponse>('/superadmin/dashboard/', {
    params,
  });
  return res.data;
};

export const fetchMyDashboard = async (params?: DashboardParams): Promise<DashboardResponse> => {
  const res = await http.get<DashboardResponse>('/my-dashboard/', {
    params,
  });
  return res.data;
};
