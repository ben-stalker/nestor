import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { VehicleBooking } from '../../src/vehicles/types';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {},
}));

const BookingModal = (await import('../../src/vehicles/BookingModal')).default;

function makeBooking(overrides: Partial<VehicleBooking> = {}): VehicleBooking {
  return {
    id: 1,
    vehicle_id: 1,
    profile_id: 1,
    start_datetime: Date.now() + 3_600_000,
    end_datetime: Date.now() + 7_200_000,
    notes: null,
    ...overrides,
  };
}

describe('BookingModal', () => {
  it('renders "Book vehicle" heading for new booking', () => {
    render(<BookingModal vehicleId={1} onSubmit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Book vehicle' })).toBeInTheDocument();
  });

  it('renders "Edit booking" heading when editing', () => {
    render(
      <BookingModal vehicleId={1} booking={makeBooking()} onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: 'Edit booking' })).toBeInTheDocument();
  });

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    render(<BookingModal vehicleId={1} onSubmit={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows conflict alert when times overlap existing booking', () => {
    const now = Date.now();
    const existing: VehicleBooking[] = [
      makeBooking({ start_datetime: now + 3_600_000, end_datetime: now + 7_200_000 }),
    ];
    render(
      <BookingModal
        vehicleId={1}
        existingBookings={existing}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert', { name: 'Booking conflict' })).toBeInTheDocument();
  });

  it('submit button is disabled when conflict exists', () => {
    const now = Date.now();
    const existing: VehicleBooking[] = [
      makeBooking({ start_datetime: now + 3_600_000, end_datetime: now + 7_200_000 }),
    ];
    render(
      <BookingModal
        vehicleId={1}
        existingBookings={existing}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Book' })).toBeDisabled();
  });
});
