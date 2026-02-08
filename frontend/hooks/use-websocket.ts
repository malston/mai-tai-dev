'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Get WebSocket URL - uses NEXT_PUBLIC_WS_URL if set, otherwise constructs from current host
function getWsUrl(): string {
  // If env var is set (production), use it
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) {
    return envUrl;
  }

  // Server-side fallback
  if (typeof window === 'undefined') {
    return 'ws://localhost:8000';
  }

  // Client-side fallback: use same host as the page, but port 8000 (for local dev on LAN)
  const { hostname } = window.location;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${hostname}:8000`;
}

const WS_URL = getWsUrl();

// Heartbeat configuration
const HEARTBEAT_INTERVAL_MS = 30000; // Send ping every 30 seconds
const PONG_TIMEOUT_MS = 5000; // If no pong within 5 seconds, reconnect

interface WebSocketMessage {
  type: string;
  message?: {
    id: string;
    workspace_id: string;
    user_id: string | null;
    agent_name: string | null;
    sender_name: string | null;
    sender_avatar_url: string | null;
    content: string;
    message_metadata: Record<string, unknown>;
    created_at: string;
    message_type: string;
  };
  workspace_id?: string;
}

interface UseWebSocketOptions {
  workspaceId: string | null;
  token: string | null;
  onMessage?: (message: NonNullable<WebSocketMessage['message']>) => void;
}

export function useWebSocket({ workspaceId, token, onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const pongTimeoutRef = useRef<NodeJS.Timeout>();
  const awaitingPongRef = useRef(false);

  // Store the latest onMessage callback in a ref to avoid stale closures
  // This ensures the WebSocket always calls the latest callback, even after re-renders
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Clear all heartbeat timers
  const clearHeartbeatTimers = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = undefined;
    }
    awaitingPongRef.current = false;
  }, []);

  const connect = useCallback(() => {
    if (!workspaceId || !token) return;

    // Clean up existing connection and timers
    clearHeartbeatTimers();
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${WS_URL}/api/v1/ws/workspaces/${workspaceId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected to workspace:', workspaceId);
      setIsConnected(true);

      // Start heartbeat interval
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN && !awaitingPongRef.current) {
          console.log('Sending heartbeat ping...');
          awaitingPongRef.current = true;
          ws.send('ping');

          // Set timeout for pong response
          pongTimeoutRef.current = setTimeout(() => {
            if (awaitingPongRef.current) {
              console.log('No pong received within timeout, reconnecting...');
              awaitingPongRef.current = false;
              // Force reconnect - close and reconnect
              ws.close();
              connect();
            }
          }, PONG_TIMEOUT_MS);
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        // Check for pong response (plain text, not JSON)
        if (event.data === 'pong') {
          console.log('Received pong, connection alive');
          awaitingPongRef.current = false;
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current);
            pongTimeoutRef.current = undefined;
          }
          return;
        }

        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        // Use ref to always get the latest callback (avoids stale closure)
        if (data.type === 'new_message' && data.message && onMessageRef.current) {
          onMessageRef.current(data.message);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      clearHeartbeatTimers();

      // Attempt to reconnect after 3 seconds if not intentionally closed
      if (event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [workspaceId, token, clearHeartbeatTimers]); // Removed onMessage - now using ref

  // Force reconnect - useful when tab becomes visible again
  const reconnect = useCallback(() => {
    console.log('Force reconnecting WebSocket...');
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      clearHeartbeatTimers();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect, clearHeartbeatTimers]);

  // Reconnect when tab becomes visible again (mobile browsers suspend WebSocket connections)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, reconnecting WebSocket...');
        // Small delay to let the browser fully wake up
        setTimeout(() => {
          connect();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connect]);

  return { isConnected, reconnect };
}

