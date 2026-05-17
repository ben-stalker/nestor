import { describe, it, vi, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

const mockSaveMutate = vi.fn();
const mockDeleteMutate = vi.fn();
let mockStatus = {
  configured: false,
  accountNumber: null as string | null,
  mpan: null as string | null,
  meterSerial: null as string | null,
  gasMprn: null as string | null,
  gasMeterSerial: null as string | null,
  tariffCode: null as string | null,
};
let mockAdminPin: string | null = '1234';
let mockIsLoading = false;

vi.mock('../../src/ev/api', () => ({
  useOctopusStatus: () => ({ data: mockStatus, isLoading: mockIsLoading }),
  useSaveOctopusCredentials: () => ({ mutate: mockSaveMutate, isPending: false }),
  useDeleteOctopusCredentials: () => ({ mutate: mockDeleteMutate, isPending: false }),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => mockAdminPin),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const OctopusSettings = (await import('../../src/ev/OctopusSettings')).default;

const notConfiguredStatus = {
  configured: false,
  accountNumber: null,
  mpan: null,
  meterSerial: null,
  gasMprn: null,
  gasMeterSerial: null,
  tariffCode: null,
};

const configuredStatus = {
  configured: true,
  accountNumber: 'A-TESTACCT',
  mpan: '1234567890123',
  meterSerial: 'E1A001',
  gasMprn: '9876543210',
  gasMeterSerial: 'G1A001',
  tariffCode: 'E-1R-VAR-22-11-01-C',
};

beforeEach(() => {
  vi.resetAllMocks();
  mockStatus = { ...notConfiguredStatus };
  mockAdminPin = '1234';
  mockIsLoading = false;
  mockSaveMutate.mockReset();
  mockDeleteMutate.mockReset();
});

describe('OctopusSettings — not configured', () => {
  it('shows the connect form when not configured and admin pin present', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <OctopusSettings />
      </QueryClientProvider>,
    );
    expect(screen.getByPlaceholderText('sk_live_...')).toBeDefined();
    expect(screen.getByPlaceholderText('A-XXXXXXXX')).toBeDefined();
    expect(screen.getByRole('button', { name: /connect/i })).toBeDefined();
  });

  it('shows loading skeleton while status is loading', () => {
    mockIsLoading = true;
    const { container } = render(
      <QueryClientProvider client={makeQC()}>
        <OctopusSettings />
      </QueryClientProvider>,
    );
    // Should not show form or status while loading
    expect(container.querySelector('form')).toBeNull();
  });

  it('shows admin-required message when no admin pin', () => {
    mockAdminPin = null;
    render(
      <QueryClientProvider client={makeQC()}>
        <OctopusSettings />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/admin access required/i)).toBeDefined();
  });

  it('calls save mutation when connect form is submitted', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <OctopusSettings />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('sk_live_...'), {
      target: { value: 'sk_live_abc123' },
    });
    fireEvent.change(screen.getByPlaceholderText('A-XXXXXXXX'), {
      target: { value: 'A-TESTACCT' },
    });

    const form = screen.getByRole('button', { name: /connect/i }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSaveMutate).toHaveBeenCalledWith(
        { apiKey: 'sk_live_abc123', accountNumber: 'A-TESTACCT' },
        expect.any(Object),
      );
    });
  });
});

describe('OctopusSettings — configured', () => {
  beforeEach(() => {
    mockStatus = { ...configuredStatus };
  });

  it('shows connected status with account number, MPAN, and tariff', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <OctopusSettings />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/connected/i)).toBeDefined();
    expect(screen.getByText('A-TESTACCT')).toBeDefined();
    expect(screen.getByText('1234567890123')).toBeDefined();
    expect(screen.getByText('E-1R-VAR-22-11-01-C')).toBeDefined();
  });

  it('shows disconnect button when admin pin is set', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <OctopusSettings />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeDefined();
  });

  it('calls delete mutation when disconnect button is clicked', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <OctopusSettings />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith(undefined, expect.any(Object));
    });
  });

  it('hides disconnect button when no admin pin', () => {
    mockAdminPin = null;
    render(
      <QueryClientProvider client={makeQC()}>
        <OctopusSettings />
      </QueryClientProvider>,
    );
    expect(screen.queryByRole('button', { name: /disconnect/i })).toBeNull();
  });
});
