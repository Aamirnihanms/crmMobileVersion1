import { useCallback, useEffect, useRef, useState } from 'react';
import { http } from '@/src/api/http';

const WS_PATH = '/ws/chat/';
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL_MS = 25000;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const toWebSocketBase = (apiBaseUrl: string) => {
  const normalized = trimTrailingSlash(apiBaseUrl || '');
  if (!normalized) return '';

  const withoutApi = normalized.replace(/\/api$/, '');
  if (withoutApi.startsWith('https://')) {
    return `wss://${withoutApi.slice('https://'.length)}`;
  }
  if (withoutApi.startsWith('http://')) {
    return `ws://${withoutApi.slice('http://'.length)}`;
  }
  return withoutApi;
};

const buildWebSocketUrl = (token: string) => {
  const apiBase = String(http.defaults.baseURL || '');
  const wsBase = toWebSocketBase(apiBase) || 'ws://localhost:8000';
  const root = trimTrailingSlash(wsBase);
  const path = WS_PATH.startsWith('/') ? WS_PATH : `/${WS_PATH}`;
  const fullUrl = `${root}${path}`;
  return `${fullUrl}?token=${encodeURIComponent(token)}`;
};

export type ChatWsEvent = {
  type?: string;
  error?: string;
  chat_uid?: string;
  [key: string]: unknown;
};

type UseChatWebSocketOptions = {
  token: string;
  enabled?: boolean;
  onMessage?: (data: ChatWsEvent) => void;
};

export function useChatWebSocket({
  token,
  enabled = true,
  onMessage,
}: UseChatWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  type TimerHandle = ReturnType<typeof setTimeout>;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<TimerHandle | null>(null);
  const pingIntervalRef = useRef<TimerHandle | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const joinedChatsRef = useRef<Set<string>>(new Set());

  onMessageRef.current = onMessage;

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !token) return;

    const current = wsRef.current;
    if (
      current &&
      (current.readyState === WebSocket.OPEN ||
        current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = buildWebSocketUrl(token);
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
      setLastError(null);

      pingIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ action: 'ping' }));
        }
      }, PING_INTERVAL_MS);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ChatWsEvent;
        if (payload.type === 'pong') return;
        if (payload.type === 'chat_joined' && payload.chat_uid) {
          joinedChatsRef.current.add(payload.chat_uid);
          return;
        }
        if (payload.type === 'chat_left' && payload.chat_uid) {
          joinedChatsRef.current.delete(payload.chat_uid);
          return;
        }
        if (typeof onMessageRef.current === 'function') {
          onMessageRef.current(payload);
        }
      } catch {
        // ignore invalid events
      }
    };

    socket.onerror = () => {
      setLastError('Connection error');
    };

    socket.onclose = (event) => {
      setIsConnected(false);
      clearTimers();
      wsRef.current = null;

      if (!enabled) return;
      if (event.code === 1000) return;
      if (event.code === 4001 || event.code === 4002) {
        setLastError('Authentication failed');
        return;
      }

      const attempts = reconnectAttemptsRef.current;
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        setLastError('Unable to reconnect');
        return;
      }

      const delay = Math.min(
        INITIAL_RECONNECT_DELAY * 2 ** attempts,
        MAX_RECONNECT_DELAY
      );
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [clearTimers, enabled, token]);

  const disconnect = useCallback(() => {
    clearTimers();
    joinedChatsRef.current.clear();
    reconnectAttemptsRef.current = 0;

    const socket = wsRef.current;
    wsRef.current = null;
    if (socket) {
      socket.close(1000, 'Closed by client');
    }
    setIsConnected(false);
  }, [clearTimers]);

  const joinChat = useCallback((chatUid: string) => {
    if (!chatUid) return;
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (joinedChatsRef.current.has(chatUid)) return;

    socket.send(
      JSON.stringify({
        action: 'join_chat',
        chat_uid: chatUid,
      })
    );
    joinedChatsRef.current.add(chatUid);
  }, []);

  const leaveChat = useCallback((chatUid: string) => {
    if (!chatUid) return;
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!joinedChatsRef.current.has(chatUid)) return;

    socket.send(
      JSON.stringify({
        action: 'leave_chat',
        chat_uid: chatUid,
      })
    );
    joinedChatsRef.current.delete(chatUid);
  }, []);

  useEffect(() => {
    if (!enabled || !token) {
      disconnect();
      return;
    }
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled, token]);

  return {
    isConnected,
    lastError,
    joinChat,
    leaveChat,
  };
}
