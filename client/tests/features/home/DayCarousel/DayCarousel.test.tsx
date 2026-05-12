import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode, ComponentProps } from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      layout: _layout,
      transition: _t,
      ...props
    }: ComponentProps<'button'> & { layout?: unknown; transition?: unknown }) => (
      <button {...props}>{children}</button>
    ),
    div: ({
      children,
      ...props
    }: ComponentProps<'div'> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => <div {...props}>{children}</div>,
  },
  LayoutGroup: ({ children }: { children: ReactNode }) => <>{children}</>,
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../src/api/client', () => ({
  default: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/lines-between-class-members
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

vi.mock('../../../../src/api/weather', () => ({ getWeather: vi.fn() }));

const DayCarousel = (await import('../../../../src/features/home/DayCarousel')).default;

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return localDateStr(new Date());
}

function makeRange() {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + 4);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function renderCarousel() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { start, end } = makeRange();
  return render(
    <QueryClientProvider client={qc}>
      <DayCarousel start={start} end={end} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DayCarousel', () => {
  it('renders the carousel region', () => {
    renderCarousel();
    expect(screen.getByTestId('day-carousel')).toBeInTheDocument();
  });

  it('renders 6 day cards (yesterday + today + 4 future)', () => {
    renderCarousel();
    const cards = screen.getAllByRole('button', { name: /Mon|Tue|Wed|Thu|Fri|Sat|Sun/ });
    expect(cards.length).toBeGreaterThanOrEqual(6);
  });

  it('today card is initially focal (aria-pressed=true)', () => {
    renderCarousel();
    const todayCard = screen.getByTestId(`day-card-${todayStr()}`);
    expect(todayCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not show "Back to Today" pill when on today', () => {
    renderCarousel();
    expect(screen.queryByTestId('back-to-today')).toBeNull();
  });

  it('clicking a non-focal card makes it focal', () => {
    renderCarousel();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = localDateStr(yesterday);
    const yesterdayCard = screen.getByTestId(`day-card-${yesterdayStr}`);

    fireEvent.click(yesterdayCard);
    expect(yesterdayCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows "Back to Today" pill after navigating away from today', () => {
    renderCarousel();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    fireEvent.click(screen.getByTestId(`day-card-${localDateStr(yesterday)}`));
    expect(screen.getByTestId('back-to-today')).toBeInTheDocument();
  });

  it('"Back to Today" pill returns focus to today', () => {
    renderCarousel();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    fireEvent.click(screen.getByTestId(`day-card-${localDateStr(yesterday)}`));
    fireEvent.click(screen.getByTestId('back-to-today'));
    expect(screen.getByTestId(`day-card-${todayStr()}`)).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking focal card opens day view modal', () => {
    renderCarousel();
    const todayCard = screen.getByTestId(`day-card-${todayStr()}`);
    fireEvent.click(todayCard);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('day view modal can be closed', () => {
    renderCarousel();
    fireEvent.click(screen.getByTestId(`day-card-${todayStr()}`));
    fireEvent.click(screen.getByLabelText('Close day view'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
