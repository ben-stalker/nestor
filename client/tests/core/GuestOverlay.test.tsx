import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GuestOverlay from '../../src/core/GuestOverlay';
import useAppStore from '../../src/store/appStore';
import type { Profile } from '../../src/api/profiles';

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
  verifyAdminPin: vi.fn(),
}));

const { verifyAdminPin } = await import('../../src/api/admin');

const GUEST_PROFILE: Profile = {
  id: 5,
  name: 'Babysitter',
  type: 'guest',
  colour: '#88c98e',
  avatar_path: null,
  pinSet: false,
  text_size: 'default',
  simplified_nav: 0,
  created_at: 1000,
};

function makeQC(profiles: Profile[] = [GUEST_PROFILE]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['profiles'], profiles);
  return qc;
}

function renderOverlay(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <GuestOverlay />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAppStore.setState({ guestProfileId: null });
  vi.clearAllMocks();
});

describe('GuestOverlay — hidden when not in guest mode', () => {
  it('renders nothing when guestProfileId is null', () => {
    const qc = makeQC();
    const { container } = renderOverlay(qc);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when guestProfileId does not match any profile', () => {
    useAppStore.setState({ guestProfileId: '999' });
    const qc = makeQC();
    const { container } = renderOverlay(qc);
    expect(container.firstChild).toBeNull();
  });
});

describe('GuestOverlay — visible in guest mode', () => {
  beforeEach(() => {
    useAppStore.setState({ guestProfileId: '5' });
  });

  it('renders guest mode region with profile name', () => {
    renderOverlay(makeQC());
    expect(screen.getByRole('main', { name: /guest mode/i })).toBeInTheDocument();
    expect(screen.getByText('Babysitter')).toBeInTheDocument();
  });

  it('shows all four content sections', () => {
    renderOverlay(makeQC());
    expect(screen.getByRole('heading', { name: /today's events/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /child routines/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /emergency contacts/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /today's meal/i })).toBeInTheDocument();
  });

  it('shows the exit guest mode button', () => {
    renderOverlay(makeQC());
    expect(screen.getByRole('button', { name: /exit guest mode/i })).toBeInTheDocument();
  });

  it('does not show the admin PIN dialog initially', () => {
    renderOverlay(makeQC());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('GuestOverlay — exit prompt', () => {
  beforeEach(() => {
    useAppStore.setState({ guestProfileId: '5' });
  });

  it('opens the admin PIN dialog when exit button is clicked', () => {
    renderOverlay(makeQC());
    fireEvent.click(screen.getByRole('button', { name: /exit guest mode/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/admin pin to exit guest mode/i)).toBeInTheDocument();
  });

  it('closes dialog on Escape without exiting guest mode', () => {
    renderOverlay(makeQC());
    fireEvent.click(screen.getByRole('button', { name: /exit guest mode/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useAppStore.getState().guestProfileId).toBe('5');
  });

  it('calls verifyAdminPin with entered digits', async () => {
    vi.mocked(verifyAdminPin).mockResolvedValue({ valid: true });
    renderOverlay(makeQC());
    fireEvent.click(screen.getByRole('button', { name: /exit guest mode/i }));

    '1234'.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

    await waitFor(() => expect(verifyAdminPin).toHaveBeenCalledWith('1234'));
  });

  it('clears guestProfileId on correct admin PIN', async () => {
    vi.mocked(verifyAdminPin).mockResolvedValue({ valid: true });
    renderOverlay(makeQC());
    fireEvent.click(screen.getByRole('button', { name: /exit guest mode/i }));

    '5678'.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

    await waitFor(() => expect(useAppStore.getState().guestProfileId).toBeNull());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps guest mode active and shows error on incorrect PIN', async () => {
    vi.mocked(verifyAdminPin).mockResolvedValue({ valid: false });
    renderOverlay(makeQC());
    fireEvent.click(screen.getByRole('button', { name: /exit guest mode/i }));

    '0000'.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/incorrect pin/i));
    expect(useAppStore.getState().guestProfileId).toBe('5');
  });

  it('shows rate-limit error on 429', async () => {
    const { ApiError } = await import('../../src/api/client');
    vi.mocked(verifyAdminPin).mockRejectedValue(new ApiError(429, 'too many'));
    renderOverlay(makeQC());
    fireEvent.click(screen.getByRole('button', { name: /exit guest mode/i }));

    '1111'.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/too many attempts/i));
  });
});
