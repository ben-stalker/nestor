import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../src/hooks/useWebSocket';

class MockWebSocket {
  static CONNECTING = 0;

  static OPEN = 1;

  static CLOSING = 2;

  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;

  url: string;

  onopen: (() => void) | null = null;

  onmessage: ((e: { data: string }) => void) | null = null;

  onerror: (() => void) | null = null;

  onclose: (() => void) | null = null;

  static instances: MockWebSocket[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  // eslint-disable-next-line class-methods-use-this
  send(_data: string) {}

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useWebSocket', () => {
  it('opens connection and reflects OPEN readyState', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:3000/ws'));

    act(() => {
      MockWebSocket.instances[0]?.simulateOpen();
    });

    expect(result.current.readyState).toBe(MockWebSocket.OPEN);
  });

  it('exposes lastMessage after receiving a frame', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:3000/ws'));

    act(() => {
      MockWebSocket.instances[0]?.simulateOpen();
      MockWebSocket.instances[0]?.simulateMessage({ event: 'alert:new', payload: { id: 1 } });
    });

    expect(result.current.lastMessage).toEqual({ event: 'alert:new', payload: { id: 1 } });
  });

  it('ignores malformed (non-JSON) frames', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:3000/ws'));

    act(() => {
      MockWebSocket.instances[0]?.simulateOpen();
      MockWebSocket.instances[0]?.simulateMessage({
        event: 'voice:status',
        payload: { status: 'idle' },
      });
    });

    const goodMsg = result.current.lastMessage;

    act(() => {
      MockWebSocket.instances[0]?.onmessage?.({ data: 'not json {{' });
    });

    expect(result.current.lastMessage).toEqual(goodMsg);
  });

  it('schedules reconnect with backoff after close', () => {
    const { result } = renderHook(() =>
      useWebSocket('ws://localhost:3000/ws', { baseDelay: 100, maxDelay: 1000, factor: 2 }),
    );

    act(() => {
      MockWebSocket.instances[0]?.simulateOpen();
      MockWebSocket.instances[0]?.simulateClose();
    });

    expect(result.current.readyState).toBe(MockWebSocket.CLOSED);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(MockWebSocket.instances.length).toBe(2);
  });

  it('applies exponential backoff on repeated failures', () => {
    renderHook(() =>
      useWebSocket('ws://localhost:3000/ws', { baseDelay: 100, maxDelay: 5000, factor: 2 }),
    );

    void act(() => MockWebSocket.instances[0]?.simulateClose());
    void act(() => vi.advanceTimersByTime(100));
    expect(MockWebSocket.instances.length).toBe(2);

    void act(() => MockWebSocket.instances[1]?.simulateClose());
    void act(() => vi.advanceTimersByTime(199));
    expect(MockWebSocket.instances.length).toBe(2);

    void act(() => vi.advanceTimersByTime(1));
    expect(MockWebSocket.instances.length).toBe(3);
  });

  it('caps backoff at maxDelay', () => {
    renderHook(() =>
      useWebSocket('ws://localhost:3000/ws', { baseDelay: 100, maxDelay: 200, factor: 10 }),
    );

    void act(() => MockWebSocket.instances[0]?.simulateClose());
    void act(() => vi.advanceTimersByTime(100));
    void act(() => MockWebSocket.instances[1]?.simulateClose());
    void act(() => vi.advanceTimersByTime(200));
    expect(MockWebSocket.instances.length).toBe(3);
  });

  it('does not reconnect after unmount', () => {
    const { unmount } = renderHook(() => useWebSocket('ws://localhost:3000/ws', { baseDelay: 50 }));

    act(() => {
      MockWebSocket.instances[0]?.simulateOpen();
    });

    unmount();

    void act(() => vi.advanceTimersByTime(500));

    expect(MockWebSocket.instances.length).toBe(1);
  });

  it('send() calls ws.send when connection is OPEN', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:3000/ws'));

    act(() => {
      MockWebSocket.instances[0]?.simulateOpen();
    });

    const instance = MockWebSocket.instances[0];
    const sendSpy = vi.spyOn(instance, 'send');

    act(() => {
      result.current.send({ event: 'alert:dismissed', payload: { id: 99 } });
    });

    expect(sendSpy).toHaveBeenCalledWith(
      JSON.stringify({ event: 'alert:dismissed', payload: { id: 99 } }),
    );
  });

  it('send() is a no-op when connection is not OPEN', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:3000/ws'));

    expect(() =>
      result.current.send({ event: 'alert:dismissed', payload: { id: 1 } }),
    ).not.toThrow();
  });
});
