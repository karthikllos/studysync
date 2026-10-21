import { useEffect, useRef, useState, useCallback } from 'react';
import { getAccessToken, ChatMessage, User } from '../api/client';

export interface PresenceUser {
  id: number;
  username: string;
  full_name: string;
  avatar_url: string;
  role: string;
}

export interface TypingEvent {
  user_id: number;
  username: string;
  is_typing: boolean;
}

export interface DocUpdateEvent {
  doc_id: string;
  content: string;
  title: string;
  user_id: number;
  username: string;
}

interface UseWebSocketOptions {
  roomId?: string;
  onChatMessage?: (message: ChatMessage) => void;
  onPresenceUpdate?: (activeUsers: PresenceUser[]) => void;
  onTyping?: (typing: TypingEvent) => void;
  onDocUpdate?: (doc: DocUpdateEvent) => void;
  onDrawStroke?: (stroke: any) => void;
  onClearBoard?: () => void;
}

export function useWebSocket({
  roomId,
  onChatMessage,
  onPresenceUpdate,
  onTyping,
  onDocUpdate,
  onDrawStroke,
  onClearBoard,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [activeTypers, setActiveTypers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Keep callback refs fresh
  const onChatRef = useRef(onChatMessage);
  onChatRef.current = onChatMessage;
  const onPresenceRef = useRef(onPresenceUpdate);
  onPresenceRef.current = onPresenceUpdate;
  const onTypingRef = useRef(onTyping);
  onTypingRef.current = onTyping;
  const onDocRef = useRef(onDocUpdate);
  onDocRef.current = onDocUpdate;
  const onDrawRef = useRef(onDrawStroke);
  onDrawRef.current = onDrawStroke;
  const onClearRef = useRef(onClearBoard);
  onClearRef.current = onClearBoard;

  const connect = useCallback(() => {
    if (!roomId) return;

    const token = getAccessToken() || '';
    const wsUrl = `ws://localhost:8000/ws/rooms/${roomId}/?token=${token}`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { action } = data;

          if (action === 'chat_message') {
            onChatRef.current?.(data.message);
          } else if (action === 'presence_update') {
            setActiveUsers(data.active_users || []);
            onPresenceRef.current?.(data.active_users || []);
          } else if (action === 'typing') {
            if (data.is_typing) {
              setActiveTypers((prev) => Array.from(new Set([...prev, data.username])));
            } else {
              setActiveTypers((prev) => prev.filter((name) => name !== data.username));
            }
            onTypingRef.current?.(data);
          } else if (action === 'doc_update') {
            onDocRef.current?.(data);
          } else if (action === 'draw_stroke') {
            onDrawRef.current?.(data.stroke);
          } else if (action === 'clear_board') {
            onClearRef.current?.();
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect in 3s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      socket.onerror = (err) => {
        console.warn('WebSocket connection error (will auto-reconnect):', err);
        socket.close();
      };
    } catch (e) {
      console.error('WS connection failure:', e);
    }
  }, [roomId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendChatMessage = useCallback((content: string, options: { message_type?: string; code_language?: string; attachment_url?: string; attachment_name?: string } = {}) => {
    send({
      action: 'chat_message',
      content,
      message_type: options.message_type || 'TEXT',
      code_language: options.code_language || '',
      attachment_url: options.attachment_url || '',
      attachment_name: options.attachment_name || '',
    });
  }, [send]);

  const sendTyping = useCallback((is_typing: boolean) => {
    send({ action: 'typing', is_typing });
  }, [send]);

  const sendDocUpdate = useCallback((doc_id: string, content: string, title?: string) => {
    send({ action: 'doc_update', doc_id, content, title });
  }, [send]);

  const sendDrawStroke = useCallback((stroke: any) => {
    send({ action: 'draw_stroke', stroke });
  }, [send]);

  const clearBoard = useCallback(() => {
    send({ action: 'clear_board' });
  }, [send]);

  return {
    isConnected,
    activeUsers,
    activeTypers,
    sendChatMessage,
    sendTyping,
    sendDocUpdate,
    sendDrawStroke,
    clearBoard,
  };
}
