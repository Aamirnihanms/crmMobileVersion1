import type { QueryClient } from '@tanstack/react-query';
import { NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY } from '../queries/notifications.query';

const notificationRefreshState = new WeakMap<
  QueryClient,
  { timer: ReturnType<typeof setTimeout> | null; lastInvalidatedAt: number }
>();

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

export const getNotificationUnreadCountFromCache = (queryClient: QueryClient) => {
  const current = queryClient.getQueryData<UnreadCountCache>(
    NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY
  );
  return toUnreadCount(current?.unread_count);
};

export const setNotificationUnreadCountInCache = (
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

export const incrementNotificationUnreadCountInCache = (
  queryClient: QueryClient,
  amount = 1
) => {
  const safeAmount = Math.max(0, Math.floor(amount));
  if (!safeAmount) return;

  const current = getNotificationUnreadCountFromCache(queryClient);
  setNotificationUnreadCountInCache(queryClient, current + safeAmount);
};

export const scheduleNotificationUnreadCountRefresh = (
  queryClient: QueryClient,
  options?: {
    minIntervalMs?: number;
    debounceMs?: number;
  }
) => {
  const minIntervalMs = Math.max(0, options?.minIntervalMs ?? 12_000);
  const debounceMs = Math.max(0, options?.debounceMs ?? 800);
  const now = Date.now();

  const existingState =
    notificationRefreshState.get(queryClient) ?? {
      timer: null,
      lastInvalidatedAt: 0,
    };

  const run = () => {
    existingState.timer = null;
    existingState.lastInvalidatedAt = Date.now();
    void queryClient.invalidateQueries({
      queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    });
  };

  const elapsed = now - existingState.lastInvalidatedAt;
  if (!existingState.timer && elapsed >= minIntervalMs) {
    notificationRefreshState.set(queryClient, existingState);
    run();
    return;
  }

  if (existingState.timer) {
    clearTimeout(existingState.timer);
  }

  const remaining = Math.max(0, minIntervalMs - elapsed);
  const waitMs = Math.max(debounceMs, remaining);

  existingState.timer = setTimeout(run, waitMs);
  notificationRefreshState.set(queryClient, existingState);
};
