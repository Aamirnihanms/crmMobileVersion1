import { useInfiniteQuery } from '@tanstack/react-query';
import {
  getAllActiveUsers,
  getChatBatches,
  getChatList,
  getChatStudents,
  getMessage,
  type ChatListParams,
  type ChatType,
} from '../api/chat.api';

type ChatListInfiniteOptions = {
  search?: string;
  archivedOnly?: boolean;
  unreadOnly?: boolean;
  chatType?: ChatType;
  pageSize?: number;
  enabled?: boolean;
};

export const useInfiniteChatList = ({
  search,
  archivedOnly,
  unreadOnly,
  chatType,
  pageSize = 30,
  enabled = true,
}: ChatListInfiniteOptions = {}) => {
  return useInfiniteQuery({
    queryKey: [
      'chat-list',
      search?.trim() || '',
      Boolean(archivedOnly),
      Boolean(unreadOnly),
      chatType || 'all',
      pageSize,
    ],
    initialPageParam: 1,
    enabled,
    queryFn: ({ pageParam }) => {
      const params: ChatListParams = {
        page: pageParam,
        page_size: pageSize,
      };
      if (search?.trim()) params.search = search.trim();
      if (archivedOnly) params.archived_only = true;
      if (unreadOnly) params.unread_only = true;
      if (chatType) params.chat_type = chatType;

      return getChatList(params);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.next ? allPages.length + 1 : undefined,
  });
};

type ChatRecipientsOptions = {
  search?: string;
  pageSize?: number;
  enabled?: boolean;
};

export const useInfiniteChatUsers = ({
  search,
  pageSize = 30,
  enabled = true,
}: ChatRecipientsOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ['chat-users', search?.trim() || '', pageSize],
    initialPageParam: 1,
    enabled,
    queryFn: ({ pageParam }) =>
      getAllActiveUsers({
        page: pageParam,
        page_size: pageSize,
        search: search?.trim() || undefined,
      }),
    getNextPageParam: (lastPage, allPages) => {
      // Try DRF-style "next" first
      if (lastPage?.next) return allPages.length + 1;

      // Fallback to custom "total_pages" logic
      const currentPage = Number(lastPage?.page ?? allPages.length);
      const totalPages = Number(lastPage?.total_pages ?? currentPage);
      if (!Number.isFinite(currentPage) || !Number.isFinite(totalPages)) {
        return undefined;
      }
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
};

export const useInfiniteChatStudents = ({
  search,
  pageSize = 30,
  enabled = true,
}: ChatRecipientsOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ['chat-students', search?.trim() || '', pageSize],
    initialPageParam: 1,
    enabled,
    queryFn: ({ pageParam }) =>
      getChatStudents({
        page: pageParam,
        page_size: pageSize,
        search: search?.trim() || undefined,
      }),
    getNextPageParam: (lastPage, allPages) => {
      // Standard DRF "next"
      if (lastPage?.next) return allPages.length + 1;

      // Custom "data.pagination"
      const pagination = lastPage?.data?.pagination;
      if (!pagination?.has_next) return undefined;
      const currentPage = Number(pagination.current_page || 1);
      return currentPage + 1;
    },
  });
};

export const useInfiniteChatBatches = ({
  search,
  pageSize = 30,
  enabled = true,
}: ChatRecipientsOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ['chat-batches', search?.trim() || '', pageSize],
    initialPageParam: 1,
    enabled,
    queryFn: ({ pageParam }) =>
      getChatBatches({
        page: pageParam,
        page_size: pageSize,
        search: search?.trim() || undefined,
      }),
    getNextPageParam: (lastPage, allPages) => {
      // Standard DRF "next"
      if (lastPage?.next) return allPages.length + 1;

      // Custom "pagination"
      const pagination = lastPage?.pagination;
      const currentPage = Number(pagination?.current_page || 1);
      const totalPages = Number(pagination?.total_pages || currentPage);
      if (!Number.isFinite(currentPage) || !Number.isFinite(totalPages)) {
        return undefined;
      }
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
};

export const useInfiniteChatMessages = (
  chatUid: string,
  pageSize = 50,
  enabled = true
) => {
  return useInfiniteQuery({
    queryKey: ['chat-messages', chatUid, pageSize],
    initialPageParam: 1,
    enabled: enabled && Boolean(chatUid),
    queryFn: ({ pageParam }) =>
      getMessage(chatUid, {
        page: pageParam,
        page_size: pageSize,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.has_next) return undefined;
      const currentPage = Number(lastPage.page ?? allPages.length);
      return Number.isFinite(currentPage) ? currentPage + 1 : undefined;
    },
  });
};
