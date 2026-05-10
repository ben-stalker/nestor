import { useEffect, useRef, useState, useCallback } from 'react';

export interface WsMessage {
  event: string;
  payload: unknown;
}

export interface UseWebSocketOptions {
  /** Base delay in ms for the first retry. Default: 500 */
  baseDelay?: number;
  /** Maximum backoff delay in ms. Default: 30_000 */
  maxDelay?: number;
  /** Multiply backoff by this factor each attempt. Default: 2 */
  factor?: number;
}

export interface UseWebSocketResult {
  lastMessage: WsMessage | null;
  readyState: number;
  send: (msg: WsMessage) => void;
}

const WS_URL =
  typeof window !== 'undefined' ? `ws://${window.location.host}/ws` : 'ws://localhost:3000/ws';

export function useWebSocket(
  url: string = WS_URL,
  options: UseWebSocketOptions = {},
): UseWebSocketResult {
  const { baseDelay = 500, maxDelay = 30_000, factor = 2 } = options;

  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef<number>(baseDelay);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setReadyState(WebSocket.CONNECTING);

    ws.onopen = () => {
      if (unmountedRef.current) return;
      setReadyState(WebSocket.OPEN);
      delayRef.current = baseDelay;
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      if (unmountedRef.current) return;
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        setLastMessage(msg);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      // onclose fires next — schedule reconnect there
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      setReadyState(WebSocket.CLOSED);
      const delay = Math.min(delayRef.current, maxDelay);
      delayRef.current = Math.min(delayRef.current * factor, maxDelay);
      retryRef.current = setTimeout(connect, delay);
    };
  }, [url, baseDelay, maxDelay, factor]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      if (retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { lastMessage, readyState, send };
}
