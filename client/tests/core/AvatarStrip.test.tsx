import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AvatarStrip from '../../src/core/AvatarStrip';
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

vi.mock('../../src/api/profiles', async () => {
  const { ApiError } = await import('../../src/api/client');
  return { getProfiles: vi.fn(), verifyPin: vi.fn(), ApiError };
});

vi.mock('../../src/core/applyProfileSettings', () => ({
  applyProfileSettings: vi.fn(),
}));

const { getProfiles, verifyPin } = await import('../../src/api/profiles');
const { applyProfileSettings } = await import('../../src/core/applyProfileSettings');

const PROFILE_A: Profile = {
  id: 1,
  name: 'Alice',
  type: 'admin',
  colour: '#ff6b6b',
  avatar_path: null,
  pinSet: false,
  text_size: 'default',
  simplified_nav: 0,
  created_at: 1000,
};

const PROFILE_B: Profile = {
  id: 2,
  name: 'Bob',
  type: 'child',
  colour: '#45b7b8',
  avatar_path: null,
  pinSet: true,
  text_size: 'large',
  simplified_nav: 0,
  created_at: 2000,
};

const PROFILE_GUEST_NO_PIN: Profile = {
  id: 3,
  name: 'Babysitter',
  type: 'guest',
  colour: '#88c98e',
  avatar_path: null,
  pinSet: false,
  text_size: 'default',
  simplified_nav: 0,
  created_at: 3000,
};

const PROFILE_GUEST_PIN: Profile = {
  id: 4,
  name: 'GuestPinned',
  type: 'guest',
  colour: '#7b9ed9',
  avatar_path: null,
  pinSet: true,
  text_size: 'default',
  simplified_nav: 0,
  created_at: 4000,
};

function makeQC(profiles: Profile[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['profiles'], profiles);
  return qc;
}

function renderStrip(profiles: Profile[] = [PROFILE_A, PROFILE_B]) {
  const qc = makeQC(profiles);
  vi.mocked(getProfiles).mockResolvedValue(profiles);
  return render(
    <QueryClientProvider client={qc}>
      <AvatarStrip />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAppStore.setState({ activeProfileId: '1', adminPin: null });
  vi.clearAllMocks();
});

describe('AvatarStrip — rendering', () => {
  it('renders an avatar button for each profile', () => {
    renderStrip();
    expect(screen.getByRole('button', { name: /switch to alice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch to bob/i })).toBeInTheDocument();
  });

  it('marks the active profile as pressed', () => {
    renderStrip();
    expect(screen.getByRole('button', { name: /switch to alice/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /switch to bob/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('shows profile names', () => {
    renderStrip();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

describe('AvatarStrip — no-PIN switch', () => {
  it('switches profile immediately when profile has no PIN', () => {
    renderStrip();
    fireEvent.click(screen.getByRole('button', { name: /switch to alice/i }));
    expect(useAppStore.getState().activeProfileId).toBe('1');
    // Alice has pinSet: false — switching Alice again (already active) is fine
  });

  it('switches to a profile without PIN without opening PinPrompt', () => {
    // Make Alice inactive first
    useAppStore.setState({ activeProfileId: '2' });
    renderStrip();
    fireEvent.click(screen.getByRole('button', { name: /switch to alice/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useAppStore.getState().activeProfileId).toBe('1');
  });

  it('calls applyProfileSettings when switching', () => {
    useAppStore.setState({ activeProfileId: '2' });
    renderStrip();
    fireEvent.click(screen.getByRole('button', { name: /switch to alice/i }));
    expect(applyProfileSettings).toHaveBeenCalledWith(PROFILE_A);
  });
});

describe('AvatarStrip — PIN-required switch', () => {
  it('opens PinPrompt when tapping a profile with pinSet=true', () => {
    renderStrip();
    fireEvent.click(screen.getByRole('button', { name: /switch to bob/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/enter pin for bob/i)).toBeInTheDocument();
  });

  it('does not switch profile when PinPrompt opens', () => {
    renderStrip();
    fireEvent.click(screen.getByRole('button', { name: /switch to bob/i }));
    expect(useAppStore.getState().activeProfileId).toBe('1');
  });

  it('switches profile after correct PIN', async () => {
    vi.mocked(verifyPin).mockResolvedValue({ valid: true });
    renderStrip();
    fireEvent.click(screen.getByRole('button', { name: /switch to bob/i }));

    // Enter 4 digits via keypad buttons
    '1234'.split('').forEach((d) => {
      fireEvent.click(screen.getByRole('button', { name: d }));
    });

    await waitFor(() => expect(useAppStore.getState().activeProfileId).toBe('2'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes PinPrompt when Escape is pressed', () => {
    renderStrip();
    fireEvent.click(screen.getByRole('button', { name: /switch to bob/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('AvatarStrip — guest mode entry', () => {
  it('activates guest mode directly for guest profile with no PIN', () => {
    useAppStore.setState({ activeProfileId: '1', guestProfileId: null });
    renderStrip([PROFILE_A, PROFILE_GUEST_NO_PIN]);
    fireEvent.click(screen.getByRole('button', { name: /switch to babysitter/i }));
    expect(useAppStore.getState().guestProfileId).toBe('3');
    expect(useAppStore.getState().activeProfileId).toBe('1');
  });

  it('does not switch active profile when entering guest mode', () => {
    useAppStore.setState({ activeProfileId: '1', guestProfileId: null });
    renderStrip([PROFILE_A, PROFILE_GUEST_NO_PIN]);
    fireEvent.click(screen.getByRole('button', { name: /switch to babysitter/i }));
    expect(useAppStore.getState().activeProfileId).toBe('1');
  });

  it('opens PinPrompt for guest profile with PIN before activating guest mode', () => {
    useAppStore.setState({ activeProfileId: '1', guestProfileId: null });
    renderStrip([PROFILE_A, PROFILE_GUEST_PIN]);
    fireEvent.click(screen.getByRole('button', { name: /switch to guestpinned/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useAppStore.getState().guestProfileId).toBeNull();
  });

  it('activates guest mode after correct PIN for pinned guest profile', async () => {
    vi.mocked(verifyPin).mockResolvedValue({ valid: true });
    useAppStore.setState({ activeProfileId: '1', guestProfileId: null });
    renderStrip([PROFILE_A, PROFILE_GUEST_PIN]);
    fireEvent.click(screen.getByRole('button', { name: /switch to guestpinned/i }));

    '9876'.split('').forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

    await waitFor(() => expect(useAppStore.getState().guestProfileId).toBe('4'));
    expect(useAppStore.getState().activeProfileId).toBe('1');
  });
});

describe('AvatarStrip — kiosk mode', () => {
  it('applies locked class when kiosk_lock is set in app-settings', () => {
    const qc = makeQC([PROFILE_A, PROFILE_B]);
    qc.setQueryData(['app-settings'], { kiosk_lock: '2' });
    vi.mocked(getProfiles).mockResolvedValue([PROFILE_A, PROFILE_B]);
    render(
      <QueryClientProvider client={qc}>
        <AvatarStrip />
      </QueryClientProvider>,
    );
    expect(document.querySelector('.avatar-strip--locked')).toBeInTheDocument();
  });

  it('sets aria-disabled on the strip when kiosk is locked', () => {
    const qc = makeQC([PROFILE_A, PROFILE_B]);
    qc.setQueryData(['app-settings'], { kiosk_lock: '2' });
    vi.mocked(getProfiles).mockResolvedValue([PROFILE_A, PROFILE_B]);
    render(
      <QueryClientProvider client={qc}>
        <AvatarStrip />
      </QueryClientProvider>,
    );
    const strip = screen.getByRole('toolbar', { name: /profile switcher/i });
    expect(strip).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not apply locked class when kiosk_lock is null', () => {
    const qc = makeQC([PROFILE_A, PROFILE_B]);
    qc.setQueryData(['app-settings'], { kiosk_lock: null });
    vi.mocked(getProfiles).mockResolvedValue([PROFILE_A, PROFILE_B]);
    render(
      <QueryClientProvider client={qc}>
        <AvatarStrip />
      </QueryClientProvider>,
    );
    expect(document.querySelector('.avatar-strip--locked')).not.toBeInTheDocument();
  });
});

describe('AvatarStrip — loading state', () => {
  it('shows skeleton when profiles are loading', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(getProfiles).mockReturnValue(new Promise(() => {}));
    render(
      <QueryClientProvider client={qc}>
        <AvatarStrip />
      </QueryClientProvider>,
    );
    expect(screen.getByLabelText('Profile switcher')).toBeInTheDocument();
  });
});
