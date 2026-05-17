import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Contact } from '../../src/contacts/types';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/contacts/api', () => ({
  listContacts: vi.fn().mockResolvedValue([]),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  deleteContact: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const ContactsList = (await import('../../src/contacts/ContactsList')).default;

const mockContacts: Contact[] = [
  {
    id: 1,
    name: 'Dr. Smith',
    role: 'GP',
    phone: '01234567890',
    email: 'smith@nhs.uk',
    address: null,
    category: 'medical',
    notes: null,
    linked_pet_id: null,
    linked_vehicle_id: null,
    created_at: 1000,
  },
  {
    id: 2,
    name: 'Police',
    role: null,
    phone: '999',
    email: null,
    address: null,
    category: 'emergency',
    notes: null,
    linked_pet_id: null,
    linked_vehicle_id: null,
    created_at: 1001,
  },
  {
    id: 3,
    name: 'Builder Bob',
    role: 'Plumber',
    phone: '07700900000',
    email: null,
    address: null,
    category: 'trade',
    notes: null,
    linked_pet_id: null,
    linked_vehicle_id: null,
    created_at: 1002,
  },
];

describe('ContactsList', () => {
  it('renders without crash and shows section headers', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ContactsList isAdmin={false} isChild={false} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('contacts-list')).toBeInTheDocument();
    });
  });

  it('shows contact cards when contacts are returned', async () => {
    const { listContacts } = await import('../../src/contacts/api');
    vi.mocked(listContacts).mockResolvedValueOnce(mockContacts);

    render(
      <QueryClientProvider client={makeQC()}>
        <ContactsList isAdmin={false} isChild={false} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Police')).toBeInTheDocument();
    });
  });

  it('shows Add button for admin', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ContactsList isAdmin={true} isChild={false} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });

  it('does not show Add button for non-admin', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ContactsList isAdmin={false} isChild={false} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    });
  });

  it('child sees only emergency section', async () => {
    const { listContacts } = await import('../../src/contacts/api');
    vi.mocked(listContacts).mockResolvedValueOnce(mockContacts);

    render(
      <QueryClientProvider client={makeQC()}>
        <ContactsList isAdmin={false} isChild={true} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/emergency/i)).toBeInTheDocument();
      expect(screen.queryByText(/medical/i)).not.toBeInTheDocument();
    });
  });

  it('search filters contacts by name', async () => {
    const { listContacts } = await import('../../src/contacts/api');
    vi.mocked(listContacts).mockResolvedValueOnce(mockContacts);

    render(
      <QueryClientProvider client={makeQC()}>
        <ContactsList isAdmin={false} isChild={false} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Police' } });
    await waitFor(() => {
      expect(screen.queryByText('Dr. Smith')).not.toBeInTheDocument();
    });
  });

  it('section collapse hides cards', async () => {
    const { listContacts } = await import('../../src/contacts/api');
    vi.mocked(listContacts).mockResolvedValueOnce([mockContacts[0]]);

    render(
      <QueryClientProvider client={makeQC()}>
        <ContactsList isAdmin={false} isChild={false} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    const medicalHeader = screen.getByRole('button', { name: /medical/i });
    fireEvent.click(medicalHeader);
    await waitFor(() => {
      expect(screen.queryByText('Dr. Smith')).not.toBeInTheDocument();
    });
  });
});
