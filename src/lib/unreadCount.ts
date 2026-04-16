import type { QueryClient } from '@tanstack/react-query';

export const CHAT_UNREAD_COUNT_QUERY_KEY = [
  'chat',
  'unread-count',
] as const;

const unreadRefreshState = new WeakMap<
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

export const getUnreadCountFromCache = (queryClient: QueryClient) => {
  const current = queryClient.getQueryData<UnreadCountCache>(
    CHAT_UNREAD_COUNT_QUERY_KEY
  );
  return toUnreadCount(current?.unread_count);
};

export const setUnreadCountInCache = (
  queryClient: QueryClient,
  unreadCount: number
) => {
  queryClient.setQueryData<UnreadCountCache>(
    CHAT_UNREAD_COUNT_QUERY_KEY,
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

export const scheduleUnreadCountRefresh = (
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
    unreadRefreshState.get(queryClient) ?? {
      timer: null,
      lastInvalidatedAt: 0,
    };

  const run = () => {
    existingState.timer = null;
    existingState.lastInvalidatedAt = Date.now();
    void queryClient.invalidateQueries({
      queryKey: CHAT_UNREAD_COUNT_QUERY_KEY,
    });
  };

  const elapsed = now - existingState.lastInvalidatedAt;
  if (!existingState.timer && elapsed >= minIntervalMs) {
    unreadRefreshState.set(queryClient, existingState);
    run();
    return;
  }

  if (existingState.timer) {
    clearTimeout(existingState.timer);
  }

  const remaining = Math.max(0, minIntervalMs - elapsed);
  const waitMs = Math.max(debounceMs, remaining);

  existingState.timer = setTimeout(run, waitMs);
  unreadRefreshState.set(queryClient, existingState);
};
