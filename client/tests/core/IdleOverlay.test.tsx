import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IdleOverlay from '../../src/core/IdleOverlay';
import type { IdleState } from '../../src/hooks/useIdleTimer';

vi.mock('../../src/api/admin', () => ({
  triggerDpmsOff: vi.fn().mockResolvedValue(undefined),
  setBrightness: vi.fn().mockResolvedValue(undefined),
  activateKioskLock: vi.fn(),
  unlockKiosk: vi.fn(),
  verifyAdminPin: vi.fn(),
}));

vi.mock('../../src/hooks/useIdleTimer', () => ({
  useIdleTimer: vi.fn(),
}));

const { triggerDpmsOff } = await import('../../src/api/admin');
const { useIdleTimer } = await import('../../src/hooks/useIdleTimer');
const mockUseIdleTimer = useIdleTimer as ReturnType<typeof vi.fn>;

function stubIdleTimer(idleState: IdleState, wake = vi.fn()) {
  mockUseIdleTimer.mockReturnValue({ idleState, wake });
}

function makeQC(settings: Record<string, unknown> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['app-settings'], settings);
  return qc;
}

function renderOverlay(settings: Record<string, unknown> = {}) {
  const qc = makeQC(settings);
  return render(
    <QueryClientProvider client={qc}>
      <IdleOverlay />
    </QueryClientProvider>,
  );
}

describe('IdleOverlay', () => {
  afterEach(() => {
    vi.clearAllMocks();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders nothing when idle state is active', () => {
    stubIdleTimer('active');
    renderOverlay();
    expect(screen.queryByTestId('idle-overlay')).toBeNull();
  });

  it('renders overlay when idle state is dim', () => {
    stubIdleTimer('dim');
    renderOverlay();
    expect(screen.getByTestId('idle-overlay')).toBeInTheDocument();
  });

  it('renders overlay when idle state is sleep', () => {
    stubIdleTimer('sleep');
    renderOverlay();
    expect(screen.getByTestId('idle-overlay')).toBeInTheDocument();
  });

  it('applies idle_dim_level as --idle-opacity CSS var', () => {
    stubIdleTimer('dim');
    renderOverlay({ idle_dim_level: 0.15 });
    expect(screen.getByTestId('idle-overlay')).toHaveStyle({ '--idle-opacity': '0.15' });
  });

  it('uses default dim level (0.1) when idle_dim_level not set', () => {
    stubIdleTimer('dim');
    renderOverlay({});
    expect(screen.getByTestId('idle-overlay')).toHaveStyle({ '--idle-opacity': '0.1' });
  });

  it('uses night_mode_dim_level when inside night window', () => {
    // 23:00 falls in 22:00–07:00 window
    vi.setSystemTime(new Date('2026-05-10T23:00:00'));
    stubIdleTimer('dim');
    renderOverlay({
      night_mode_enabled: true,
      night_mode_start: '22:00',
      night_mode_end: '07:00',
      idle_dim_level: 0.1,
      night_mode_dim_level: 0.03,
    });
    expect(screen.getByTestId('idle-overlay')).toHaveStyle({ '--idle-opacity': '0.03' });
    vi.useRealTimers();
  });

  it('does NOT use night dim level outside night window', () => {
    // 14:00 is outside 22:00–07:00 window
    vi.setSystemTime(new Date('2026-05-10T14:00:00'));
    stubIdleTimer('dim');
    renderOverlay({
      night_mode_enabled: true,
      night_mode_start: '22:00',
      night_mode_end: '07:00',
      idle_dim_level: 0.12,
      night_mode_dim_level: 0.03,
    });
    expect(screen.getByTestId('idle-overlay')).toHaveStyle({ '--idle-opacity': '0.12' });
    vi.useRealTimers();
  });

  it('calls wake() when overlay is clicked', () => {
    const wake = vi.fn();
    stubIdleTimer('dim', wake);
    renderOverlay();
    fireEvent.click(screen.getByTestId('idle-overlay'));
    expect(wake).toHaveBeenCalledOnce();
  });

  it('overlay carries aria-hidden so it does not interrupt screen readers', () => {
    stubIdleTimer('dim');
    const { container } = renderOverlay();
    const overlay = container.querySelector('.idle-overlay');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  it('passes correct thresholds to useIdleTimer from settings', () => {
    stubIdleTimer('active');
    renderOverlay({ idle_dim_seconds: 45, idle_sleep_seconds: 300 });
    expect(mockUseIdleTimer).toHaveBeenCalledWith(
      expect.objectContaining({ dimAfterMs: 45_000, sleepAfterMs: 300_000 }),
    );
  });

  it('uses default thresholds (90s dim, 600s sleep) when settings absent', () => {
    stubIdleTimer('active');
    renderOverlay({});
    expect(mockUseIdleTimer).toHaveBeenCalledWith(
      expect.objectContaining({ dimAfterMs: 90_000, sleepAfterMs: 600_000 }),
    );
  });

  it('onSleep callback calls triggerDpmsOff', () => {
    stubIdleTimer('active');
    renderOverlay({});
    // Extract the onSleep callback passed to useIdleTimer
    const { onSleep } = mockUseIdleTimer.mock.calls[0][0] as { onSleep: () => void };
    onSleep();
    expect(triggerDpmsOff).toHaveBeenCalledOnce();
  });
});
