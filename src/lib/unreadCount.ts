import type { QueryClient } from '@tanstack/react-query';

export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = [
  'notifications',
  'unread-count',
] as const;

type UnreadCountCache = {
  unread_count: number;
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

export const getUnreadCountFromCache = (queryClient: QueryClient) => {
  const current = queryClient.getQueryData<UnreadCountCache>(
    NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY
  );
  return toUnreadCount(current?.unread_count);
};

export const setUnreadCountInCache = (
  queryClient: QueryClient,
  unreadCount: number
) => {
  queryClient.setQueryData<UnreadCountCache>(
    NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    {
      unread_count: toUnreadCount(unreadCount),
    }
  );
};

export const incrementUnreadCountInCache = (
  queryClient: QueryClient,
  amount = 1
) => {
  const safeAmount = Math.max(0, Math.floor(amount));
  if (!safeAmount) return;

  const current = getUnreadCountFromCache(queryClient);
  setUnreadCountInCache(queryClient, current + safeAmount);
};

export const decrementUnreadCountInCache = (
  queryClient: QueryClient,
  amount = 1
) => {
  const safeAmount = Math.max(0, Math.floor(amount));
  if (!safeAmount) return;

  const current = getUnreadCountFromCache(queryClient);
  setUnreadCountInCache(queryClient, Math.max(0, current - safeAmount));
};
