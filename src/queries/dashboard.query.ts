import { useQuery } from '@tanstack/react-query';
import {
  type DashboardTimeframeParam,
  fetchMyDashboard,
  fetchSuperadminDashboard,
} from '../api/dashboard.api';

export const SUPERADMIN_DASHBOARD_QUERY_KEY = 'dashboard-superadmin';
export const MY_DASHBOARD_QUERY_KEY = 'dashboard-my';

export const useSuperadminDashboard = (
  timeframe: DashboardTimeframeParam,
  enabled = true
) => {
  return useQuery({
    queryKey: [SUPERADMIN_DASHBOARD_QUERY_KEY, timeframe],
    queryFn: () => fetchSuperadminDashboard({ timeframe }),
    enabled,
    staleTime: 30 * 1000,
  });
};

export const useMyDashboard = (
  timeframe: DashboardTimeframeParam,
  enabled = true
) => {
  return useQuery({
    queryKey: [MY_DASHBOARD_QUERY_KEY, timeframe],
    queryFn: () => fetchMyDashboard({ timeframe }),
    enabled,
    staleTime: 30 * 1000,
  });
};
