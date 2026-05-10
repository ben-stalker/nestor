import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KioskOverlay from '../../src/core/KioskOverlay';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/lines-between-class-members
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

vi.mock('../../src/api/admin', () => ({
  unlockKiosk: vi.fn(),
}));

const { unlockKiosk } = await import('../../src/api/admin');
const apiFetch = (await import('../../src/api/client')).default;

function makeQC(settings: Record<string, unknown> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['app-settings'], settings);
  return qc;
}

function renderOverlay(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <KioskOverlay />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiFetch).mockResolvedValue({});
});

describe('KioskOverlay — not locked', () => {
  it('renders nothing when kiosk_lock is null', () => {
    const qc = makeQC({ kiosk_lock: null });
    const { container } = renderOverlay(qc);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when kiosk_lock is absent from settings', () => {
    const qc = makeQC({});
    const { container } = renderOverlay(qc);
    expect(container.firstChild).toBeNull();
  });
});

describe('KioskOverlay — locked', () => {
  it('shows the lock status indicator when kiosk_lock is set', () => {
    const qc = makeQC({ kiosk_lock: '2' });
    renderOverlay(qc);
    expect(screen.getByRole('status', { name: /screen is locked/i })).toBeInTheDocument();
  });

  it('does not show the admin PIN dialog initially', () => {
    const qc = makeQC({ kiosk_lock: '2' });
    renderOverlay(qc);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the admin PIN dialog after triple-tap on the hidden target', () => {
    const qc = makeQC({ kiosk_lock: '2' });
    renderOverlay(qc);
    const tapTarget = screen.getByRole('button', { name: /admin unlock/i });
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/admin pin to unlock/i)).toBeInTheDocument();
  });

  it('does not open dialog on fewer than three taps', () => {
    const qc = makeQC({ kiosk_lock: '2' });
    renderOverlay(qc);
    const tapTarget = screen.getByRole('button', { name: /admin unlock/i });
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the dialog when dismissed', () => {
    const qc = makeQC({ kiosk_lock: '2' });
    renderOverlay(qc);
    const tapTarget = screen.getByRole('button', { name: /admin unlock/i });
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('KioskOverlay — admin PIN entry', () => {
  it('calls unlockKiosk with entered PIN on 4 digits', async () => {
    vi.mocked(unlockKiosk).mockResolvedValue({ valid: true });
    const qc = makeQC({ kiosk_lock: '2' });
    renderOverlay(qc);

    const tapTarget = screen.getByRole('button', { name: /admin unlock/i });
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);

    '5678'.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

    await waitFor(() => expect(unlockKiosk).toHaveBeenCalledWith('5678'));
  });

  it('closes dialog and invalidates settings on successful unlock', async () => {
    vi.mocked(unlockKiosk).mockResolvedValue({ valid: true });
    const qc = makeQC({ kiosk_lock: '2' });
    const invalidate = vi.spyOn(qc, 'invalidateQueries');
    renderOverlay(qc);

    const tapTarget = screen.getByRole('button', { name: /admin unlock/i });
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);

    '1234'.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['app-settings'] });
  });

  it('shows error and keeps dialog open on incorrect PIN', async () => {
    vi.mocked(unlockKiosk).mockResolvedValue({ valid: false });
    const qc = makeQC({ kiosk_lock: '2' });
    renderOverlay(qc);

    const tapTarget = screen.getByRole('button', { name: /admin unlock/i });
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);

    '0000'.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/incorrect pin/i));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows rate-limit message on 429 error', async () => {
    const { ApiError } = await import('../../src/api/client');
    vi.mocked(unlockKiosk).mockRejectedValue(new ApiError(429, 'too many'));
    const qc = makeQC({ kiosk_lock: '2' });
    renderOverlay(qc);

    const tapTarget = screen.getByRole('button', { name: /admin unlock/i });
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);
    fireEvent.click(tapTarget);

    '1111'.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/too many attempts/i));
  });
});
