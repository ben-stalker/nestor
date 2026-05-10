import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdleTimer } from '../../src/hooks/useIdleTimer';

describe('useIdleTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('starts in active state', () => {
    const { result } = renderHook(() => useIdleTimer({ dimAfterMs: 1000, sleepAfterMs: 2000 }));
    expect(result.current.idleState).toBe('active');
  });

  it('transitions to dim after dimAfterMs', async () => {
    const { result } = renderHook(() => useIdleTimer({ dimAfterMs: 1000, sleepAfterMs: 5000 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.idleState).toBe('dim');
  });

  it('transitions to sleep after sleepAfterMs total', async () => {
    const onSleep = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimer({ dimAfterMs: 1000, sleepAfterMs: 3000, onSleep }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(result.current.idleState).toBe('sleep');
    expect(onSleep).toHaveBeenCalledOnce();
  });

  it('resets to active when wake() is called', async () => {
    const { result } = renderHook(() => useIdleTimer({ dimAfterMs: 1000, sleepAfterMs: 5000 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.idleState).toBe('dim');
    act(() => {
      result.current.wake();
    });
    expect(result.current.idleState).toBe('active');
  });

  it('resets timer on wake so dim fires again after dimAfterMs', async () => {
    const { result } = renderHook(() => useIdleTimer({ dimAfterMs: 1000, sleepAfterMs: 5000 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.idleState).toBe('dim');

    await act(async () => {
      result.current.wake();
      await vi.advanceTimersByTimeAsync(500);
    });
    // Not yet dim — timer reset
    expect(result.current.idleState).toBe('active');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.idleState).toBe('dim');
  });

  it('does not call onSleep if wake() is called before sleep threshold', async () => {
    const onSleep = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimer({ dimAfterMs: 1000, sleepAfterMs: 3000, onSleep }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    act(() => {
      result.current.wake();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    // Dim fires at 1000ms after wake, not sleep
    expect(result.current.idleState).toBe('dim');
    expect(onSleep).not.toHaveBeenCalled();
  });

  it('cleans up timers on unmount', async () => {
    const onSleep = vi.fn();
    const { unmount } = renderHook(() =>
      useIdleTimer({ dimAfterMs: 500, sleepAfterMs: 1000, onSleep }),
    );
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onSleep).not.toHaveBeenCalled();
  });
});
