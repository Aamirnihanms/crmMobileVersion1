import { http } from './http';


export type Notification = {
  uid: string;
  title: string;
  message: string;
  link: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
};

export type NotificationsPageResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
};

export type NotificationsUnreadCountResponse = {
  unread_count: number;
};

export const getNotificationsUnreadCount = async () => {
  const res = await http.get<NotificationsUnreadCountResponse>(
    '/notifications/unread_count/'
  );
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await http.post('/notifications/mark_all_read/', {});
  return res.data;
};

export const fetchNotifications = async (
  page: number,
  pageSize = 10
): Promise<NotificationsPageResponse> => {
  console.log('➡️ GET /notifications/ page:', page);
  const res = await http.get<NotificationsPageResponse>('/notifications/', {
    params: {
      page,
      page_size: pageSize,
    },
  });
  return res.data;
};

