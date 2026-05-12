import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeatherModal from '../../../src/features/home/WeatherModal';
import type { WeatherData } from '../../../src/api/weather';

const MOCK_WEATHER: WeatherData = {
  current: { temperature_2m: 18, weather_code: 0, wind_speed_10m: 5, precipitation: 0 },
  hourly: { time: [], temperature_2m: [], weather_code: [], precipitation_probability: [] },
  daily: {
    time: ['2026-05-12', '2026-05-13', '2026-05-14'],
    weather_code: [0, 3, 61],
    temperature_2m_max: [22, 20, 17],
    temperature_2m_min: [12, 10, 9],
    precipitation_sum: [0, 0, 5],
    precipitation_probability_max: [5, 20, 80],
    uv_index_max: [5, 4, 2],
  },
  fetchedAt: Date.now(),
};

describe('WeatherModal', () => {
  it('renders forecast rows when open', () => {
    render(<WeatherModal open={true} onClose={() => {}} weather={MOCK_WEATHER} unit="celsius" />);
    expect(screen.getByTestId('weather-forecast')).toBeInTheDocument();
    expect(screen.getAllByTestId(/forecast-day-/)).toHaveLength(3);
  });

  it('shows Today label for first day', () => {
    render(<WeatherModal open={true} onClose={() => {}} weather={MOCK_WEATHER} unit="celsius" />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows temperatures in celsius', () => {
    render(<WeatherModal open={true} onClose={() => {}} weather={MOCK_WEATHER} unit="celsius" />);
    expect(screen.getByTestId('forecast-day-0')).toHaveTextContent('22°C');
    expect(screen.getByTestId('forecast-day-0')).toHaveTextContent('12°C');
  });

  it('shows temperatures in fahrenheit', () => {
    render(
      <WeatherModal open={true} onClose={() => {}} weather={MOCK_WEATHER} unit="fahrenheit" />,
    );
    // 22°C → 72°F, 12°C → 54°F
    expect(screen.getByTestId('forecast-day-0')).toHaveTextContent('72°F');
    expect(screen.getByTestId('forecast-day-0')).toHaveTextContent('54°F');
  });

  it('shows UV index for each day', () => {
    render(<WeatherModal open={true} onClose={() => {}} weather={MOCK_WEATHER} unit="celsius" />);
    expect(screen.getByTestId('forecast-day-0')).toHaveTextContent('UV 5');
  });

  it('shows precipitation probability for each day', () => {
    render(<WeatherModal open={true} onClose={() => {}} weather={MOCK_WEATHER} unit="celsius" />);
    expect(screen.getByTestId('forecast-day-2')).toHaveTextContent('80%');
  });

  it('calls onClose when Escape key pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<WeatherModal open={true} onClose={onClose} weather={MOCK_WEATHER} unit="celsius" />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
