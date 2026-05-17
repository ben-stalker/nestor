import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OctopusConsumptionChart from '../../src/ev/OctopusConsumptionChart';
import type { OctopusConsumptionDay } from '../../src/ev/types';

function makeDay(date: string, kwh: number, costMinor: number): OctopusConsumptionDay {
  return { date, kwh, costMinor };
}

const sampleData: OctopusConsumptionDay[] = [
  makeDay('2026-05-01', 5.2, 180),
  makeDay('2026-05-02', 3.8, 145),
  makeDay('2026-05-03', 6.1, 202),
  makeDay('2026-05-04', 4.5, 163),
  makeDay('2026-05-05', 2.9, 125),
];

describe('OctopusConsumptionChart', () => {
  it('renders an SVG element when data is provided', () => {
    const { container } = render(
      <OctopusConsumptionChart data={sampleData} fuelType="electricity" unitRatePence={24.5} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('shows "No data yet" when data array is empty', () => {
    render(<OctopusConsumptionChart data={[]} fuelType="electricity" unitRatePence={24.5} />);
    expect(screen.getByTestId('no-data-message')).toBeDefined();
    expect(screen.getByText(/no data yet/i)).toBeDefined();
  });

  it('renders the correct number of bars', () => {
    const { container } = render(
      <OctopusConsumptionChart data={sampleData} fuelType="electricity" unitRatePence={24.5} />,
    );
    const bars = container.querySelectorAll('[data-testid="chart-bar"]');
    expect(bars.length).toBe(sampleData.length);
  });

  it('bar title includes kWh and cost', () => {
    const { container } = render(
      <OctopusConsumptionChart
        data={[makeDay('2026-05-01', 5.2, 180)]}
        fuelType="electricity"
        unitRatePence={24.5}
      />,
    );
    const title = container.querySelector('title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toContain('5.20kWh');
    expect(title!.textContent).toContain('£1.80');
  });

  it('uses blue fill colour for electricity', () => {
    const { container } = render(
      <OctopusConsumptionChart data={sampleData} fuelType="electricity" unitRatePence={24.5} />,
    );
    const bar = container.querySelector('[data-testid="chart-bar"]');
    expect(bar?.getAttribute('fill')).toBe('#3b82f6');
  });

  it('uses amber fill colour for gas', () => {
    const { container } = render(
      <OctopusConsumptionChart data={sampleData} fuelType="gas" unitRatePence={6.5} />,
    );
    const bar = container.querySelector('[data-testid="chart-bar"]');
    expect(bar?.getAttribute('fill')).toBe('#f59e0b');
  });

  it('renders minimum bar height (2px) even for zero kWh days', () => {
    const zeroDay = makeDay('2026-05-01', 0, 53);
    const { container } = render(
      <OctopusConsumptionChart data={[zeroDay]} fuelType="electricity" unitRatePence={24.5} />,
    );
    const bar = container.querySelector('[data-testid="chart-bar"]');
    expect(Number(bar?.getAttribute('height'))).toBeGreaterThanOrEqual(2);
  });
});
