import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SetupWizard from '../../src/wizard/SetupWizard';
import DoneStep from '../../src/wizard/steps/DoneStep';

const mockApiFetch = vi.fn().mockImplementation((path: string) => {
  if (path === '/api/v1/profiles') return Promise.resolve([]);
  if (path === '/api/v1/voice/status')
    return Promise.resolve({ online: false, status: 'unavailable', hasAudio: false });
  return Promise.resolve({});
});

vi.mock('../../src/api/client', () => ({
  get default() {
    return mockApiFetch;
  },
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/wizard/api', () => ({
  patchSettings: vi.fn().mockResolvedValue(undefined),
  completeSetup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/core/hooks/useAppSettings', () => ({
  useAppSettings: () => ({ data: { setup_complete: false }, isLoading: false }),
  APP_SETTINGS_KEY: ['app-settings'],
}));

function makeQC() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['profiles'], []);
  qc.setQueryData(['calendar-accounts'], []);
  qc.setQueryData(['voice-status'], { online: false, status: 'unavailable', hasAudio: false });
  return qc;
}

function renderWizard() {
  return render(
    <QueryClientProvider client={makeQC()}>
      <SetupWizard />
    </QueryClientProvider>,
  );
}

describe('SetupWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders SetupWizard with test id', () => {
    renderWizard();
    expect(screen.getByTestId('setup-wizard')).toBeInTheDocument();
  });

  it('shows WizardProgress with 1/10 on first step', () => {
    renderWizard();
    expect(screen.getByLabelText('Step 1 of 10')).toBeInTheDocument();
    expect(screen.getByText('1 / 10')).toBeInTheDocument();
  });

  it('shows the Nestor Setup branding', () => {
    renderWizard();
    expect(screen.getByText('Nestor Setup')).toBeInTheDocument();
  });

  it('shows language step title on first render', () => {
    renderWizard();
    expect(screen.getByText('Choose your language')).toBeInTheDocument();
  });

  it('shows language cards', () => {
    renderWizard();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  it('advances to step 2 after Next is clicked on language step', async () => {
    const { patchSettings } = await import('../../src/wizard/api');
    renderWizard();

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      const { calls } = vi.mocked(patchSettings).mock;
      expect(calls.length).toBeGreaterThan(0);
      const [firstCallArg] = calls[0];
      expect(typeof firstCallArg.language).toBe('string');
    });

    await waitFor(() => {
      expect(screen.getByText('Regional settings')).toBeInTheDocument();
    });
  });

  it('marks step as skipped when Skip is clicked on calendar step', async () => {
    const { patchSettings } = await import('../../src/wizard/api');
    vi.mocked(patchSettings).mockResolvedValue(undefined);

    const adminProfile = {
      id: 1,
      name: 'Admin',
      type: 'admin',
      colour: '#6366f1',
      pinSet: false,
      text_size: 'default',
      simplified_nav: 0,
      permissions_json: {},
      avatar_path: null,
      created_at: 0,
    };

    mockApiFetch.mockImplementation((path: string) => {
      if (path === '/api/v1/profiles') return Promise.resolve([adminProfile]);
      if (path === '/api/v1/calendar/accounts') return Promise.resolve([]);
      return Promise.resolve({});
    });

    const qc = makeQC();
    qc.setQueryData(['profiles'], [adminProfile]);
    qc.setQueryData(['calendar-accounts'], []);

    render(
      <QueryClientProvider client={qc}>
        <SetupWizard />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByText('Regional settings'));

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByText('Household profiles'));

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => screen.getByText('Calendar accounts'));

    fireEvent.click(screen.getByRole('button', { name: /skip/i }));

    await waitFor(() => {
      expect(screen.getByText('Display settings')).toBeInTheDocument();
    });
  });

  it('DoneStep shows Finish button', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <DoneStep skippedSteps={new Set()} onFinish={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
  });

  it('DoneStep Finish button calls completeSetup and onFinish', async () => {
    const { completeSetup } = await import('../../src/wizard/api');
    vi.mocked(completeSetup).mockResolvedValue(undefined);
    const onFinish = vi.fn();

    render(
      <QueryClientProvider client={makeQC()}>
        <DoneStep skippedSteps={new Set()} onFinish={onFinish} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /finish/i }));

    await waitFor(() => {
      expect(completeSetup).toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalled();
    });
  });

  it('DoneStep shows skipped step count', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <DoneStep skippedSteps={new Set([3, 6])} onFinish={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/2 steps skipped/i)).toBeInTheDocument();
  });

  it('DoneStep shows completed step count', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <DoneStep skippedSteps={new Set()} onFinish={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/9 steps completed/i)).toBeInTheDocument();
  });
});
