import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Pet } from '../../src/pets/types';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/pets/api', () => ({
  listHealthLogs: vi.fn().mockResolvedValue([]),
  createHealthLog: vi.fn(),
  updateHealthLog: vi.fn(),
  deleteHealthLog: vi.fn(),
  deletePet: vi.fn(),
  updatePet: vi.fn(),
  uploadPetPhoto: vi.fn(),
  uploadDocument: vi.fn(),
  createPet: vi.fn(),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 1,
    name: 'Buddy',
    species: 'dog',
    breed: 'Labrador',
    dob: '2020-01-01',
    colour: 'Yellow',
    microchip: '12345',
    insurance_policy: null,
    vet_name: 'Dr Smith',
    vet_phone: '01234 567890',
    vet_address: null,
    feeding_notes: null,
    grooming_notes: null,
    photo_path: null,
    is_active: true,
    created_at: 1000,
    updated_at: 1000,
    ...overrides,
  };
}

const PetDetail = (await import('../../src/pets/PetDetail')).default;

describe('PetDetail', () => {
  it('renders pet name in header', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <PetDetail pet={makePet()} onDeleted={() => {}} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Buddy')).toBeInTheDocument();
    });
  });

  it('renders Overview, Health Log, and Documents tabs', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <PetDetail pet={makePet()} onDeleted={() => {}} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Health Log' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Documents' })).toBeInTheDocument();
    });
  });

  it('renders vet info when vet_name present', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <PetDetail pet={makePet()} onDeleted={() => {}} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Dr Smith')).toBeInTheDocument();
    });
  });
});
