import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PetHealthLog } from '../../src/pets/types';

const HealthLogEntry = (await import('../../src/pets/health/HealthLogEntry')).default;

function makeLog(overrides: Partial<PetHealthLog> = {}): PetHealthLog {
  return {
    id: 1,
    pet_id: 1,
    log_type: 'vaccination',
    title: 'Rabies vaccine',
    notes: null,
    log_date: '2024-01-15',
    next_due_date: null,
    reminder_days_before: 7,
    weight_kg: null,
    document_path: null,
    document_name: null,
    linked_calendar_event_id: null,
    created_at: 1000,
    updated_at: 1000,
    ...overrides,
  };
}

describe('HealthLogEntry', () => {
  it('renders log title', () => {
    render(<HealthLogEntry log={makeLog()} petId={1} />);
    expect(screen.getByText('Rabies vaccine')).toBeInTheDocument();
  });

  it('renders log_type badge', () => {
    render(<HealthLogEntry log={makeLog()} petId={1} />);
    expect(screen.getByText('Vaccination')).toBeInTheDocument();
  });

  it('renders next_due_date chip when provided', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    render(<HealthLogEntry log={makeLog({ next_due_date: tomorrowStr })} petId={1} />);
    expect(screen.getByTestId('next-due-chip')).toBeInTheDocument();
    expect(screen.getByText('Due tomorrow')).toBeInTheDocument();
  });

  it('does not render next_due_chip when next_due_date is null', () => {
    render(<HealthLogEntry log={makeLog()} petId={1} />);
    expect(screen.queryByTestId('next-due-chip')).not.toBeInTheDocument();
  });

  it('shows calendar badge for vet_visit with linked_calendar_event_id', () => {
    render(
      <HealthLogEntry
        log={makeLog({ log_type: 'vet_visit', title: 'Annual', linked_calendar_event_id: 42 })}
        petId={1}
      />,
    );
    expect(screen.getByText('Added to calendar')).toBeInTheDocument();
  });

  it('renders weight for weight log_type', () => {
    render(<HealthLogEntry log={makeLog({ log_type: 'weight', weight_kg: 10.5 })} petId={1} />);
    expect(screen.getByText('10.50 kg')).toBeInTheDocument();
  });
});
