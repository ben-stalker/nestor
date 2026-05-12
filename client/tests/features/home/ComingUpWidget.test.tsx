import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ComingUpWidget from '../../../src/features/home/ComingUpWidget';
import type { ComingUpResponse, ComingUpItem } from '../../../src/api/comingUp';

vi.mock('../../../src/api/comingUp', () => ({
  getComingUp: vi.fn(),
}));

vi.mock('../../../src/api/profiles', () => ({ getProfiles: vi.fn() }));
vi.mock('../../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

const { getComingUp } = await import('../../../src/api/comingUp');

const MOCK_ITEMS: ComingUpItem[] = [
  {
    id: 'birthday-1',
    title: "Alice's Birthday",
    daysUntil: 5,
    category: 'birthday',
    deepLink: '/family/contacts/1',
  },
  {
    id: 'vehicle-mot-1',
    title: 'Car MOT due',
    daysUntil: 14,
    category: 'vehicle',
    deepLink: '/vehicles/1',
  },
  {
    id: 'finance-1',
    title: 'Insurance renewal',
    daysUntil: 30,
    category: 'finance',
    deepLink: '/finance/1',
  },
];

function renderWidget(qc: QueryClient) {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <ComingUpWidget />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ComingUpWidget', () => {
  it('renders nothing when items list is empty', () => {
    vi.mocked(getComingUp).mockResolvedValue({ items: [] });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['coming-up'], { items: [] } satisfies ComingUpResponse);

    const { container } = renderWidget(qc);
    expect(container.firstChild).toBeNull();
  });

  it('renders heading and rows when items are present', () => {
    vi.mocked(getComingUp).mockResolvedValue({ items: MOCK_ITEMS });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['coming-up'], { items: MOCK_ITEMS } satisfies ComingUpResponse);

    renderWidget(qc);
    expect(screen.getByTestId('coming-up-widget')).toBeInTheDocument();
    expect(screen.getByText(/coming up/i)).toBeInTheDocument();
    expect(screen.getByTestId('coming-up-item-birthday-1')).toBeInTheDocument();
    expect(screen.getByTestId('coming-up-item-vehicle-mot-1')).toBeInTheDocument();
    expect(screen.getByTestId('coming-up-item-finance-1')).toBeInTheDocument();
  });

  it('shows day-count chips for each item', () => {
    vi.mocked(getComingUp).mockResolvedValue({ items: MOCK_ITEMS });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['coming-up'], { items: MOCK_ITEMS } satisfies ComingUpResponse);

    renderWidget(qc);
    expect(screen.getByLabelText('in 5 days')).toBeInTheDocument();
    expect(screen.getByLabelText('in 14 days')).toBeInTheDocument();
    expect(screen.getByLabelText('in 30 days')).toBeInTheDocument();
  });

  it('shows "today" chip for daysUntil=0', () => {
    const todayItem: ComingUpItem = {
      id: 'today-1',
      title: "Mum's Birthday",
      daysUntil: 0,
      category: 'birthday',
    };
    vi.mocked(getComingUp).mockResolvedValue({ items: [todayItem] });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['coming-up'], { items: [todayItem] } satisfies ComingUpResponse);

    renderWidget(qc);
    expect(screen.getByText('today')).toBeInTheDocument();
  });

  it('disables the button when item has no deepLink', () => {
    const noLinkItem: ComingUpItem = {
      id: 'no-link',
      title: 'Public Holiday',
      daysUntil: 7,
      category: 'holiday',
    };
    vi.mocked(getComingUp).mockResolvedValue({ items: [noLinkItem] });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['coming-up'], { items: [noLinkItem] } satisfies ComingUpResponse);

    renderWidget(qc);
    expect(screen.getByTestId('coming-up-item-no-link')).toBeDisabled();
  });

  it('enables the button when item has a deepLink', () => {
    vi.mocked(getComingUp).mockResolvedValue({ items: MOCK_ITEMS });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['coming-up'], { items: MOCK_ITEMS } satisfies ComingUpResponse);

    renderWidget(qc);
    expect(screen.getByTestId('coming-up-item-birthday-1')).not.toBeDisabled();
  });

  it('shows skeleton while loading', () => {
    vi.mocked(getComingUp).mockReturnValue(new Promise(() => {}));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderWidget(qc);
    expect(screen.getByTestId('coming-up-widget')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
