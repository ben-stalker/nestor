import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Vehicle } from '../../src/vehicles/types';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {},
}));

const VehicleCard = (await import('../../src/vehicles/VehicleCard')).default;

const BASE_VEHICLE: Vehicle = {
  id: 1,
  nickname: 'Family Car',
  type: 'car',
  make: 'Ford',
  model: 'Focus',
  year: 2020,
  registration: 'AB12 CDE',
  colour: null,
  photo_path: null,
  mot_due: null,
  tax_due: null,
  insurance_due: null,
  service_due: null,
  service_due_mileage: null,
  current_mileage: null,
  active: true,
};

describe('VehicleCard', () => {
  it('renders nickname and registration', () => {
    render(<VehicleCard vehicle={BASE_VEHICLE} onClick={vi.fn()} />);
    expect(screen.getByText('Family Car')).toBeInTheDocument();
    expect(screen.getByText('AB12 CDE')).toBeInTheDocument();
  });

  it('renders red countdown chip for MOT due within 7 days', () => {
    const v = { ...BASE_VEHICLE, mot_due: Date.now() + 3 * 86_400_000 };
    render(<VehicleCard vehicle={v} onClick={vi.fn()} />);
    const chip = screen.getByText(/MOT/);
    expect(chip.className).toMatch(/red/);
  });

  it('renders amber countdown chip for tax due within 30 days', () => {
    const v = { ...BASE_VEHICLE, tax_due: Date.now() + 20 * 86_400_000 };
    render(<VehicleCard vehicle={v} onClick={vi.fn()} />);
    const chip = screen.getByText(/Tax/);
    expect(chip.className).toMatch(/amber/);
  });

  it('hides MOT chip for bicycle', () => {
    const v = { ...BASE_VEHICLE, type: 'bicycle' as const, mot_due: Date.now() + 30 * 86_400_000 };
    render(<VehicleCard vehicle={v} onClick={vi.fn()} />);
    expect(screen.queryByText(/MOT/)).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<VehicleCard vehicle={BASE_VEHICLE} onClick={onClick} />);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalled();
  });
});
