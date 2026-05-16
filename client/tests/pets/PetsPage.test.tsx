import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/pets/api', () => ({
  listPets: vi.fn().mockResolvedValue([]),
  createPet: vi.fn(),
  updatePet: vi.fn(),
  deletePet: vi.fn(),
  uploadPetPhoto: vi.fn(),
  listHealthLogs: vi.fn().mockResolvedValue([]),
  createHealthLog: vi.fn(),
  updateHealthLog: vi.fn(),
  deleteHealthLog: vi.fn(),
  uploadDocument: vi.fn(),
  getUpcomingCare: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

const mockRegisterPlugin = vi.fn();
const mockUnregisterPlugin = vi.fn();

vi.mock('../../src/store/filtersStore', () => {
  const store = {
    registerPlugin: mockRegisterPlugin,
    unregisterPlugin: mockUnregisterPlugin,
  };
  // Zustand calls store as store(selector) or store.getState()
  const mockStore = vi.fn((selector?: (s: typeof store) => unknown) => {
    if (selector) return selector(store);
    return store;
  });
  (mockStore as { getState?: () => typeof store }).getState = () => store;
  return { default: mockStore };
});

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const PetsPage = (await import('../../src/pets/PetsPage')).default;

describe('PetsPage', () => {
  it('renders without crash and shows empty state', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <PetsPage />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('pets-page')).toBeInTheDocument();
    });
  });

  it('shows Add button in pet list', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <PetsPage />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add pet/i })).toBeInTheDocument();
    });
  });

  it('shows pet cards when pets are returned', async () => {
    const { listPets } = await import('../../src/pets/api');
    vi.mocked(listPets).mockResolvedValueOnce([
      {
        id: 1,
        name: 'Buddy',
        species: 'dog',
        breed: 'Labrador',
        dob: '2020-01-01',
        colour: null,
        microchip: null,
        insurance_policy: null,
        vet_name: null,
        vet_phone: null,
        vet_address: null,
        feeding_notes: null,
        grooming_notes: null,
        photo_path: null,
        is_active: true,
        created_at: 1000,
        updated_at: 1000,
      },
    ]);
    render(
      <QueryClientProvider client={makeQC()}>
        <PetsPage />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Buddy')).toBeInTheDocument();
    });
  });
});
