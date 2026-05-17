import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn((selector: (s: { adminPin: string | null }) => unknown) =>
    selector({ adminPin: 'test-pin' }),
  ),
}));

vi.mock('../../src/core/hooks/useAppSettings', () => ({
  useAppSettings: () => ({ data: {}, isLoading: false }),
  APP_SETTINGS_KEY: ['app-settings'],
}));

// Stub all lazy-loaded panels
vi.mock('../../src/admin/ProfilesPanel', () => ({ default: () => <div>Profiles</div> }));
vi.mock('../../src/admin/LocalePanel', () => ({ default: () => <div>Locale</div> }));
vi.mock('../../src/admin/CalendarPanel', () => ({ default: () => <div>Calendar</div> }));
vi.mock('../../src/admin/DisplayPanel', () => ({ default: () => <div>Display</div> }));
vi.mock('../../src/admin/NavigationPanel', () => ({ default: () => <div>Navigation</div> }));
vi.mock('../../src/admin/VoicePanel', () => ({ default: () => <div>Voice</div> }));
vi.mock('../../src/admin/AudioPanel', () => ({ default: () => <div>Audio</div> }));
vi.mock('../../src/admin/AccessibilityPanel', () => ({ default: () => <div>Accessibility</div> }));
vi.mock('../../src/admin/NotificationsPanel', () => ({ default: () => <div>Notifications</div> }));
vi.mock('../../src/admin/SystemPanel', () => ({ default: () => <div>System</div> }));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const AdminPage = (await import('../../src/admin/AdminPage')).default;

function renderAdmin(path = '/admin/profiles') {
  return render(
    <QueryClientProvider client={makeQC()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/:section" element={<AdminPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminPage', () => {
  it('renders settings heading', () => {
    renderAdmin('/admin/profiles');
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows all section links in rail', () => {
    renderAdmin('/admin/profiles');
    // Use role query to target the nav buttons specifically, not h1 or panel content
    expect(screen.getByRole('button', { name: 'Profiles' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Language & Region' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Display & Behaviour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'System' })).toBeInTheDocument();
  });

  it('shows Done button', () => {
    renderAdmin('/admin/profiles');
    // Exact "Done" text targets the footer button, not the X (aria-label "Done — return to home")
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('shows search bar', () => {
    renderAdmin('/admin/profiles');
    expect(screen.getByPlaceholderText(/search settings/i)).toBeInTheDocument();
  });

  it('redirects to home when no adminPin', async () => {
    vi.mocked((await import('../../src/store/appStore')).default).mockImplementation(
      (selector: (s: { adminPin: string | null }) => unknown) => selector({ adminPin: null }),
    );

    render(
      <QueryClientProvider client={makeQC()}>
        <MemoryRouter initialEntries={['/admin/profiles']}>
          <Routes>
            <Route path="/admin/:section" element={<AdminPage />} />
            <Route path="/" element={<div>Home page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });
});
