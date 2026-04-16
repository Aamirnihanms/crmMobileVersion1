import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, getNotificationsUnreadCount, markAllNotificationsRead } from '../api/notifications.api';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];
export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'];

export const useNotificationsUnreadCount = (enabled = true) => {
  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    queryFn: getNotificationsUnreadCount,
    enabled,
    staleTime: 30 * 1000,
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY });
    },
  });
};

export const useNotifications = () => {
  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam = 1 }) => fetchNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.next) {
        return allPages.length + 1;
      }
      return undefined;
    },
  });
};


