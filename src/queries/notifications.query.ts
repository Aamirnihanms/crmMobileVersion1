import { useQuery } from '@tanstack/react-query';
import { getNotificationsUnreadCount } from '../api/notifications.api';
import { NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY } from '../lib/unreadCount';

export const useNotificationsUnreadCount = (enabled = true) => {
  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    queryFn: getNotificationsUnreadCount,
    enabled,
    staleTime: 30 * 1000,
  });
};
