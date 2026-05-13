import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CalendarEventRaw } from '../../src/api/calendar';
import type { Profile } from '../../src/api/profiles';

// Mock apiFetch
const mockApiFetch = vi.fn();
vi.mock('../../src/api/client', () => ({
  default: mockApiFetch,
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

const EventModal = (await import('../../src/calendar/EventModal')).default;
const useAppStore = (await import('../../src/store/appStore')).default;

const ALICE: Profile = {
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

const CHILD: Profile = {
  id: 2,
  name: 'Child',
  type: 'child',
  colour: '#6bcb77',
  avatar_path: null,
  pinSet: false,
  text_size: 'default',
  simplified_nav: 0,
  created_at: 1000,
};

function makeEvent(overrides: Partial<CalendarEventRaw> & { id: number }): CalendarEventRaw {
  const base = new Date(2026, 4, 13, 10, 0, 0, 0);
  return {
    id: overrides.id,
    title: 'Test Event',
    start_datetime: base.getTime(),
    end_datetime: base.getTime() + 3_600_000,
    all_day: 0,
    profile_id: null,
    colour_override: null,
    notes: 'Some notes',
    source: 'local',
    type: 'default',
    recurring_rule: null,
    ...overrides,
  };
}

function renderModal(
  props: Parameters<typeof EventModal>[0],
  activeProfileId: string | null = '1',
  profiles: Profile[] = [ALICE],
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['profiles'], profiles);
  useAppStore.setState({ activeProfileId });

  return render(
    <QueryClientProvider client={qc}>
      <EventModal {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({ activeProfileId: null });
});

describe('EventModal — create mode', () => {
  it('renders dialog with "New event" label', () => {
    renderModal({ mode: 'create', onClose: vi.fn() });
    expect(screen.getByRole('dialog', { name: 'New event' })).toBeInTheDocument();
  });

  it('shows title input and Save button', () => {
    renderModal({ mode: 'create', onClose: vi.fn() });
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows validation error when title is empty on submit', () => {
    renderModal({ mode: 'create', onClose: vi.fn() });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('calls mutation on valid submit', async () => {
    mockApiFetch.mockResolvedValue({ id: 99, title: 'New' });
    renderModal({ mode: 'create', onClose: vi.fn() });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Team meeting' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  });

  it('closes when Cancel is clicked', () => {
    const onClose = vi.fn();
    renderModal({ mode: 'create', onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('EventModal — view mode', () => {
  it('shows the event title in view mode', () => {
    const event = makeEvent({ id: 1, title: 'Doctor visit' });
    renderModal({ mode: 'view', event, onClose: vi.fn() });
    expect(screen.getByRole('dialog', { name: 'Doctor visit' })).toBeInTheDocument();
  });

  it('shows Edit button for local events when viewed as admin', () => {
    const event = makeEvent({ id: 1, title: 'Local event', source: 'local' });
    renderModal({ mode: 'view', event, onClose: vi.fn() });
    expect(screen.getByRole('button', { name: 'Edit event' })).toBeInTheDocument();
  });

  it('shows CalDAV read-only banner for non-admin profiles viewing synced events', () => {
    const event = makeEvent({ id: 1, title: 'Synced event', source: 'caldav' });
    renderModal({ mode: 'view', event, onClose: vi.fn() }, '2', [ALICE, CHILD]);
    expect(screen.getByText(/Synced from.*read only/i)).toBeInTheDocument();
  });
});

describe('EventModal — delete confirmation', () => {
  it('shows delete confirm card after clicking delete icon in edit mode', () => {
    const event = makeEvent({ id: 1, title: 'To delete', source: 'local' });
    renderModal({ mode: 'edit', event, onClose: vi.fn() });
    const deleteBtn = screen.getByRole('button', { name: 'Delete event' });
    fireEvent.click(deleteBtn);
    expect(screen.getByText('Delete this event?')).toBeInTheDocument();
  });

  it('can cancel the delete confirmation', () => {
    const event = makeEvent({ id: 1, title: 'Stay', source: 'local' });
    renderModal({ mode: 'edit', event, onClose: vi.fn() });
    fireEvent.click(screen.getByRole('button', { name: 'Delete event' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete this event?')).not.toBeInTheDocument();
  });
});

describe('EventModal — validation', () => {
  it('shows end-time error when end is before start', () => {
    renderModal({ mode: 'create', onClose: vi.fn() });
    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Bad times' } });

    const start = screen.getByLabelText('Start');
    const end = screen.getByLabelText('End');
    fireEvent.change(start, { target: { value: '2026-05-13T10:00' } });
    fireEvent.change(end, { target: { value: '2026-05-13T09:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('End must be after start')).toBeInTheDocument();
  });
});
