import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

const ChargingLogForm = (await import('../../src/ev/ChargingLogForm')).default;

const vehicles = [{ id: 1, nickname: 'Leaf', type: 'ev' }];

describe('ChargingLogForm', () => {
  it('renders form fields', () => {
    render(
      <ChargingLogForm vehicleId={1} vehicles={vehicles} onSave={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByLabelText(/energy charged/i)).toBeTruthy();
    expect(screen.getByText(/log session/i)).toBeTruthy();
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(
      <ChargingLogForm vehicleId={1} vehicles={vehicles} onSave={vi.fn()} onClose={onClose} />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows validation error for missing kWh', () => {
    const onSave = vi.fn();
    render(<ChargingLogForm vehicleId={1} vehicles={vehicles} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.submit(screen.getByRole('form') ?? screen.getByText(/log session/i).closest('form')!);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('renders edit mode when entry provided', () => {
    const entry = {
      id: 1,
      vehicle_id: 1,
      session_date: 1700000000,
      kwh: 30,
      cost_minor: 800,
      location: 'Home',
      notes: null,
      created_at: 1700000000,
    };
    render(
      <ChargingLogForm
        vehicleId={1}
        vehicles={vehicles}
        entry={entry}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/edit charging session/i)).toBeTruthy();
  });
});
