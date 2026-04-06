import { http } from './http';

export type NotificationsUnreadCountResponse = {
  status?: string;
  total_unread_count?: number | string | null;
  unread_count?: number | string | null;
  [key: string]: unknown;
};

const toUnreadCount = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }
  return 0;
};

export const getNotificationsUnreadCount = async () => {
  const res = await http.get<NotificationsUnreadCountResponse>(
    '/chats/unread-count/'
  );
  console.log('Unread count API response:', res.data);

  return {
    unread_count: toUnreadCount(
      res.data?.total_unread_count ?? res.data?.unread_count
    ),
  };
};
