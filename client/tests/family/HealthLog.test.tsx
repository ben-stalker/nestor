import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/family/api', () => ({
  createHealthLog: vi
    .fn()
    .mockResolvedValue({ id: 99, log_type: 'medicine', data_json: {}, logged_at: Date.now() }),
  getHealthLog: vi.fn().mockResolvedValue([]),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const HealthLog = (await import('../../src/family/HealthLog')).default;

const ENTRIES = [
  {
    id: 1,
    profile_id: 1,
    log_type: 'medicine' as const,
    data_json: { name: 'Calpol', dose: '5ml', reason: 'Fever' },
    logged_at: Date.now() - 3600_000,
  },
  {
    id: 2,
    profile_id: 1,
    log_type: 'symptom' as const,
    data_json: { text: 'Sore throat' },
    logged_at: Date.now() - 7200_000,
  },
];

describe('HealthLog', () => {
  it('renders entries in a timeline', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <HealthLog profileId={1} entries={ENTRIES} onFilterChange={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Calpol/)).toBeInTheDocument();
    expect(screen.getByText(/Sore throat/)).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <HealthLog profileId={1} entries={[]} onFilterChange={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/no entries/i)).toBeInTheDocument();
  });

  it('filter chip calls onFilterChange', () => {
    const onFilterChange = vi.fn();
    render(
      <QueryClientProvider client={makeQC()}>
        <HealthLog profileId={1} entries={ENTRIES} onFilterChange={onFilterChange} />
      </QueryClientProvider>,
    );
    // The filter group contains the chip buttons
    const filterGroup = screen.getByRole('group', { name: /filter by type/i });
    fireEvent.click(filterGroup.querySelector('button:nth-child(2)') as HTMLElement);
    expect(onFilterChange).toHaveBeenCalledWith('medicine');
  });

  it('opens add modal when add entry clicked', () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <HealthLog profileId={1} entries={[]} onFilterChange={vi.fn()} />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByText('Add entry'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
