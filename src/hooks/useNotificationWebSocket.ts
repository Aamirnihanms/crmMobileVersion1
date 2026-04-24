import { useCallback, useEffect, useRef, useState } from 'react';
import { http } from '@/src/api/http';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { 
  incrementNotificationUnreadCountInCache, 
  scheduleNotificationUnreadCountRefresh 
} from '../lib/notificationUnreadCount';

const WS_PATH = '/ws/notifications/';
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

export type NotificationWsEvent = {
  type?: string;
  title?: string;
  message?: string;
  body?: string;
  [key: string]: unknown;
};

type UseNotificationWebSocketOptions = {
  token: string;
  enabled?: boolean;
};

export function useNotificationWebSocket({
  token,
  enabled = true,
}: UseNotificationWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  type TimerHandle = ReturnType<typeof setTimeout>;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<TimerHandle | null>(null);
  const pingIntervalRef = useRef<TimerHandle | null>(null);
  const reconnectAttemptsRef = useRef(0);

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
        const payload = JSON.parse(event.data) as NotificationWsEvent;
        console.log('🔔 Notification WS Message:', payload);
        
        if (payload.type !== 'new_notification') {
          return;
        }

        const notificationData = (payload.notification as Record<string, any>) || {};
        const title = notificationData.title || payload.title || 'New Notification';
        const body = notificationData.message || payload.message || payload.body || 'A new notification arrived';

        void Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: 'default',
            data: payload,
          },
          trigger: null,
        });

        // Update unread count
        incrementNotificationUnreadCountInCache(queryClient, 1);
        scheduleNotificationUnreadCountRefresh(queryClient);

      } catch (error) {
        console.error('Notification WS Message Error:', error);
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
  }, [clearTimers, enabled, token, queryClient]);

  const disconnect = useCallback(() => {
    clearTimers();
    reconnectAttemptsRef.current = 0;

    const socket = wsRef.current;
    wsRef.current = null;
    if (socket) {
      socket.close(1000, 'Closed by client');
    }
    setIsConnected(false);
  }, [clearTimers]);

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
  };
}
