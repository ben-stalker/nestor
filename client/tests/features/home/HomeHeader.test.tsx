import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeHeader from '../../../src/features/home/HomeHeader';
import type { WeatherData } from '../../../src/api/weather';

vi.mock('../../../src/api/client', () => ({
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

vi.mock('../../../src/api/profiles', () => ({ getProfiles: vi.fn() }));
vi.mock('../../../src/api/weather', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../../src/api/weather')>();
  return { ...mod, getWeather: vi.fn() };
});

const { getProfiles } = await import('../../../src/api/profiles');
const { getWeather } = await import('../../../src/api/weather');

const MOCK_WEATHER: WeatherData = {
  current: { temperature_2m: 18, weather_code: 0, wind_speed_10m: 5, precipitation: 0 },
  hourly: { time: [], temperature_2m: [], weather_code: [], precipitation_probability: [] },
  daily: {
    time: ['2026-05-12'],
    weather_code: [0],
    temperature_2m_max: [22],
    temperature_2m_min: [12],
    precipitation_sum: [0],
    precipitation_probability_max: [15],
    uv_index_max: [5],
  },
  fetchedAt: Date.now(),
};

function renderHeader(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <HomeHeader />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getProfiles).mockResolvedValue([]);
});

describe('HomeHeader', () => {
  it('renders the header element', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHeader(qc);
    expect(screen.getByTestId('home-header')).toBeInTheDocument();
  });

  it('shows time in HH:mm format', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHeader(qc);
    const timeEl = screen.getByLabelText(/Time:/);
    expect(timeEl.textContent).toMatch(/^\d{2}:\d{2}$/);
  });

  it('shows date in long locale format', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHeader(qc);
    const date = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    expect(screen.getByText(date)).toBeInTheDocument();
  });

  it('renders the header when no profile is active', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHeader(qc);
    expect(screen.getByTestId('home-header')).toBeInTheDocument();
  });

  it('shows weather temperature when data is available', async () => {
    vi.mocked(getWeather).mockResolvedValue(MOCK_WEATHER);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['weather'], MOCK_WEATHER);

    renderHeader(qc);
    expect(await screen.findByText(/18°C/)).toBeInTheDocument();
  });

  it('shows precipitation percentage', async () => {
    vi.mocked(getWeather).mockResolvedValue(MOCK_WEATHER);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['weather'], MOCK_WEATHER);

    renderHeader(qc);
    expect(await screen.findByTestId('weather-precip')).toHaveTextContent('15%');
  });

  it('shows UV index', async () => {
    vi.mocked(getWeather).mockResolvedValue(MOCK_WEATHER);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['weather'], MOCK_WEATHER);

    renderHeader(qc);
    expect(await screen.findByTestId('weather-uv')).toHaveTextContent('UV 5');
  });

  it('opens forecast modal on weather button click', async () => {
    const user = userEvent.setup();
    vi.mocked(getWeather).mockResolvedValue(MOCK_WEATHER);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['weather'], MOCK_WEATHER);

    renderHeader(qc);
    const btn = await screen.findByRole('button', { name: /open weather forecast/i });
    await user.click(btn);
    expect(await screen.findByTestId('weather-forecast')).toBeInTheDocument();
  });

  it('shows skeleton while weather is loading', () => {
    vi.mocked(getWeather).mockImplementation(() => new Promise(() => {}));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { container } = renderHeader(qc);
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });
});
