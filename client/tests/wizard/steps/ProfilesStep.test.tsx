import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Profile } from '../../../src/api/profiles';
import ProfilesStep from '../../../src/wizard/steps/ProfilesStep';

vi.mock('../../../src/api/client', () => ({
  default: vi.fn().mockResolvedValue({}),
  ApiError: class extends Error {
    status = 0;
  },
}));

function makeQC(profiles: Profile[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['profiles'], profiles);
  return qc;
}

function renderStep(profiles: Profile[] = [], onNext = vi.fn()) {
  return render(
    <QueryClientProvider client={makeQC(profiles)}>
      <ProfilesStep onNext={onNext} />
    </QueryClientProvider>,
  );
}

const adminProfile: Profile = {
  id: 1,
  name: 'Alice',
  type: 'admin',
  colour: '#6366f1',
  pinSet: false,
  text_size: 'default',
  simplified_nav: 0,
  permissions_json: {},
  avatar_path: null,
  created_at: 0,
};

const childProfile: Profile = {
  id: 2,
  name: 'Bob',
  type: 'child',
  colour: '#ec4899',
  pinSet: false,
  text_size: 'default',
  simplified_nav: 0,
  permissions_json: {},
  avatar_path: null,
  created_at: 0,
};

describe('ProfilesStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with empty profiles and shows no profiles message', () => {
    renderStep([]);
    expect(screen.getByText('No profiles yet.')).toBeInTheDocument();
  });

  it('renders existing profiles', () => {
    renderStep([adminProfile]);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('shows Add profile button', () => {
    renderStep([]);
    expect(screen.getByText('Add profile')).toBeInTheDocument();
  });

  it('shows inline form when Add profile button is clicked', () => {
    renderStep([]);
    fireEvent.click(screen.getByText('Add profile'));
    expect(screen.getByPlaceholderText('e.g. Alice')).toBeInTheDocument();
    expect(screen.getByText('New profile')).toBeInTheDocument();
  });

  it('shows type buttons (admin, teen, child) in add form', () => {
    renderStep([]);
    fireEvent.click(screen.getByText('Add profile'));
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /teen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /child/i })).toBeInTheDocument();
  });

  it('Next button is disabled when no admin profile exists', () => {
    renderStep([childProfile]);
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeDisabled();
  });

  it('Next button is enabled when admin profile exists', () => {
    renderStep([adminProfile]);
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
  });

  it('calls onNext when Next is clicked with admin profile present', () => {
    const onNext = vi.fn();
    renderStep([adminProfile], onNext);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onNext).toHaveBeenCalled();
  });

  it('shows warning when profiles exist but none are admin', () => {
    renderStep([childProfile]);
    expect(screen.getByText(/add an admin profile to continue/i)).toBeInTheDocument();
  });

  it('cancels form and hides it when Cancel is clicked', () => {
    renderStep([]);
    fireEvent.click(screen.getByText('Add profile'));
    expect(screen.getByText('New profile')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText('New profile')).not.toBeInTheDocument();
  });

  it('submits add profile form via API', async () => {
    const apiFetch = await import('../../../src/api/client');
    const mockFn = vi.mocked(apiFetch.default);
    mockFn.mockResolvedValueOnce(adminProfile);

    const qc = makeQC([]);

    render(
      <QueryClientProvider client={qc}>
        <ProfilesStep onNext={vi.fn()} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText('Add profile'));

    const nameInput = screen.getByPlaceholderText('e.g. Alice');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith(
        '/api/v1/profiles',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
