import { describe, it, vi, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

const mockStatus = {
  configured: false as boolean,
  accountNumber: null as string | null,
  mpan: null as string | null,
  meterSerial: null as string | null,
  gasMprn: null as string | null,
  gasMeterSerial: null as string | null,
  tariffCode: null as string | null,
};

const mockConsumption = {
  configured: true,
  data: [
    { date: '2026-05-01', kwh: 5.2, costMinor: 180 },
    { date: '2026-05-02', kwh: 3.8, costMinor: 145 },
  ],
  unitRatePence: 24.5,
  standingChargePence: 53.0,
};

let statusLoading = false;
let consumptionLoading = false;

vi.mock('../../src/ev/api', () => ({
  useOctopusStatus: () => ({ data: mockStatus, isLoading: statusLoading }),
  useOctopusConsumption: () => ({ data: mockConsumption, isLoading: consumptionLoading }),
  useSaveOctopusCredentials: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteOctopusCredentials: () => ({ mutate: vi.fn(), isPending: false }),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

// Lazy import so mocks resolve first
async function renderTab() {
  const { default: OctopusTab } = await import('../../src/ev/OctopusTab');
  return render(<OctopusTab />, { wrapper: makeWrapper() });
}

describe('OctopusTab', () => {
  beforeEach(() => {
    mockStatus.configured = false;
    mockStatus.gasMprn = null;
    statusLoading = false;
    consumptionLoading = false;
  });

  it('shows the not-configured placeholder when Octopus is not connected', async () => {
    await renderTab();
    expect(screen.getByTestId('not-configured-placeholder')).toBeDefined();
    expect(screen.getByText(/not connected/i)).toBeDefined();
  });

  it('shows loading skeleton while status is loading', async () => {
    statusLoading = true;
    await renderTab();
    expect(screen.getByTestId('loading-skeleton')).toBeDefined();
  });

  it('shows period switcher and chart when configured', async () => {
    mockStatus.configured = true;
    await renderTab();
    expect(screen.getByTestId('period-switcher')).toBeDefined();
    // Chart should render (SVG is present via OctopusConsumptionChart)
    expect(screen.getByRole('img', { name: /consumption chart/i })).toBeDefined();
  });

  it('period switcher buttons render 7d, 14d, 30d options', async () => {
    mockStatus.configured = true;
    await renderTab();
    const switcher = screen.getByTestId('period-switcher');
    expect(switcher.textContent).toContain('7d');
    expect(switcher.textContent).toContain('14d');
    expect(switcher.textContent).toContain('30d');
  });

  it('changes selected period when a period button is clicked', async () => {
    mockStatus.configured = true;
    await renderTab();
    const btn7 = screen.getByText('7d');
    fireEvent.click(btn7);
    expect(btn7.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows electricity tab by default', async () => {
    mockStatus.configured = true;
    await renderTab();
    const tabs = screen.getByTestId('fuel-type-tabs');
    const elecTab = tabs.querySelector('[aria-selected="true"]');
    expect(elecTab?.textContent).toContain('Electricity');
  });

  it('hides gas tab when no gas MPRN is configured', async () => {
    mockStatus.configured = true;
    mockStatus.gasMprn = null;
    await renderTab();
    expect(screen.queryByText('Gas')).toBeNull();
  });

  it('shows gas tab when gas MPRN is present', async () => {
    mockStatus.configured = true;
    mockStatus.gasMprn = '1234567890';
    await renderTab();
    expect(screen.getByText('Gas')).toBeDefined();
  });

  it('shows summary stats when data is available', async () => {
    mockStatus.configured = true;
    await renderTab();
    expect(screen.getByTestId('summary-stats')).toBeDefined();
    // total kwh = 5.2 + 3.8 = 9.0
    expect(screen.getByText('9.0')).toBeDefined();
  });
});
