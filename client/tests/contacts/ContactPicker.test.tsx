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

const ContactPicker = (await import('../../src/contacts/ContactPicker')).default;

const mockContacts: Contact[] = [
  {
    id: 1,
    name: 'City Vets',
    role: 'Veterinary Practice',
    phone: '01234000000',
    email: null,
    address: null,
    category: 'pets',
    notes: null,
    linked_pet_id: null,
    linked_vehicle_id: null,
    created_at: 1000,
  },
  {
    id: 2,
    name: 'Bob Builder',
    role: 'Plumber',
    phone: '07700999888',
    email: null,
    address: null,
    category: 'pets',
    notes: null,
    linked_pet_id: null,
    linked_vehicle_id: null,
    created_at: 1001,
  },
];

describe('ContactPicker', () => {
  it('renders the picker with None option', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ContactPicker category="pets" value={null} onChange={vi.fn()} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('— None —')).toBeInTheDocument();
    });
  });

  it('lists contacts in the category', async () => {
    const { listContacts } = await import('../../src/contacts/api');
    vi.mocked(listContacts).mockResolvedValueOnce(mockContacts);

    render(
      <QueryClientProvider client={makeQC()}>
        <ContactPicker category="pets" value={null} onChange={vi.fn()} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/City Vets/)).toBeInTheDocument();
    });
  });

  it('calls onChange when selection changes', async () => {
    const { listContacts } = await import('../../src/contacts/api');
    vi.mocked(listContacts).mockResolvedValueOnce(mockContacts);
    const onChange = vi.fn();

    render(
      <QueryClientProvider client={makeQC()}>
        <ContactPicker category="pets" value={null} onChange={onChange} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/City Vets/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange with null when None is selected', async () => {
    const { listContacts } = await import('../../src/contacts/api');
    vi.mocked(listContacts).mockResolvedValueOnce(mockContacts);
    const onChange = vi.fn();

    render(
      <QueryClientProvider client={makeQC()}>
        <ContactPicker category="pets" value={1} onChange={onChange} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows Add New button', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ContactPicker category="pets" value={null} onChange={vi.fn()} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new contact/i })).toBeInTheDocument();
    });
  });
});
