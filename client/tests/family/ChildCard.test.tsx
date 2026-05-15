import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

const ChildCard = (await import('../../src/family/ChildCard')).default;

const BASE_SUMMARY = {
  profile: {
    id: 1,
    name: 'Alice',
    type: 'child' as const,
    colour: '#4caf50',
    avatar_path: null,
    pinSet: false,
    text_size: 'default' as const,
    simplified_nav: 0,
    created_at: 1000,
  },
  todayChores: 2,
  todayChoreTotal: 3,
  pointsBalance: 7,
  nextEvent: null,
};

describe('ChildCard', () => {
  it('renders child name and chore count', () => {
    render(<ChildCard summary={BASE_SUMMARY} onClick={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('renders star balance', () => {
    render(<ChildCard summary={BASE_SUMMARY} onClick={vi.fn()} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders next event when present', () => {
    const summary = {
      ...BASE_SUMMARY,
      nextEvent: { id: 10, title: 'Football', start_datetime: Date.now() + 86_400_000 },
    };
    render(<ChildCard summary={summary} onClick={vi.fn()} />);
    expect(screen.getByText('Football')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ChildCard summary={BASE_SUMMARY} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
