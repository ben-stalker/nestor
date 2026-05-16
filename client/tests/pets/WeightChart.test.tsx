import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PetHealthLog } from '../../src/pets/types';

const WeightChart = (await import('../../src/pets/health/WeightChart')).default;

function makeWeightLog(id: number, date: string, weight: number): PetHealthLog {
  return {
    id,
    pet_id: 1,
    log_type: 'weight',
    title: 'Weight check',
    notes: null,
    log_date: date,
    next_due_date: null,
    reminder_days_before: null,
    weight_kg: weight,
    document_path: null,
    document_name: null,
    linked_calendar_event_id: null,
    created_at: 1000,
    updated_at: 1000,
  };
}

function makeVaccinationLog(): PetHealthLog {
  return {
    id: 99,
    pet_id: 1,
    log_type: 'vaccination',
    title: 'Rabies',
    notes: null,
    log_date: '2024-01-01',
    next_due_date: null,
    reminder_days_before: null,
    weight_kg: null,
    document_path: null,
    document_name: null,
    linked_calendar_event_id: null,
    created_at: 1000,
    updated_at: 1000,
  };
}

describe('WeightChart', () => {
  it('renders null when no weight entries', () => {
    const { container } = render(<WeightChart logs={[makeVaccinationLog()]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when logs array is empty', () => {
    const { container } = render(<WeightChart logs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders SVG chart when weight data present', () => {
    const logs = [
      makeWeightLog(1, '2024-01-01', 10.0),
      makeWeightLog(2, '2024-02-01', 10.5),
      makeWeightLog(3, '2024-03-01', 11.0),
    ];
    render(<WeightChart logs={logs} />);
    expect(screen.getByTestId('weight-chart')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /weight over time/i })).toBeInTheDocument();
  });

  it('renders single weight stat when only one entry', () => {
    const logs = [makeWeightLog(1, '2024-01-15', 10.0)];
    render(<WeightChart logs={logs} />);
    expect(screen.getByTestId('weight-chart')).toBeInTheDocument();
    expect(screen.getByText('10.0 kg')).toBeInTheDocument();
  });

  it('shows the most recent weight prominently', () => {
    const logs = [
      makeWeightLog(1, '2024-01-01', 10.0),
      makeWeightLog(2, '2024-06-01', 12.5),
    ];
    render(<WeightChart logs={logs} />);
    expect(screen.getByText('12.5 kg')).toBeInTheDocument();
  });
});
