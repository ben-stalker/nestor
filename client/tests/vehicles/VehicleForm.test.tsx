import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../src/api/client', () => ({
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

const VehicleForm = (await import('../../src/vehicles/VehicleForm')).default;

describe('VehicleForm', () => {
  it('renders MOT field for car type', () => {
    render(<VehicleForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('MOT due')).toBeInTheDocument();
  });

  it('hides MOT field for bicycle type', () => {
    render(<VehicleForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    // Change type to bicycle
    fireEvent.change(screen.getByLabelText('Type *'), { target: { value: 'bicycle' } });
    expect(screen.queryByLabelText('MOT due')).not.toBeInTheDocument();
  });

  it('hides MOT field for EV type', () => {
    render(<VehicleForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Type *'), { target: { value: 'ev' } });
    expect(screen.queryByLabelText('MOT due')).not.toBeInTheDocument();
  });

  it('submit button disabled with empty nickname', () => {
    render(<VehicleForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Add vehicle' });
    expect(btn).toBeDisabled();
  });

  it('submit button enabled with nickname', () => {
    render(<VehicleForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nickname *'), { target: { value: 'Family Car' } });
    expect(screen.getByRole('button', { name: 'Add vehicle' })).not.toBeDisabled();
  });

  it('calls onSubmit with form data', () => {
    const onSubmit = vi.fn();
    render(<VehicleForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nickname *'), { target: { value: 'My Car' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Add vehicle' }).closest('form')!);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ nickname: 'My Car', type: 'car' }),
    );
  });
});
