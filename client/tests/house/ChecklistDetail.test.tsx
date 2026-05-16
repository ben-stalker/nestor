import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

const mockChecklist = {
  id: 1,
  name: 'Morning Routine',
  type: 'daily_reset' as const,
  auto_reset_cron: null,
  template_id: null,
  last_reset_at: null,
  guest_name: null,
  guest_arrival_date: null,
  created_at: Date.now(),
  items: [
    {
      id: 10,
      checklist_id: 1,
      text: 'Brush teeth',
      ticked: false,
      sort_order: 0,
      section: null,
    },
    {
      id: 11,
      checklist_id: 1,
      text: 'Breakfast',
      ticked: true,
      sort_order: 1,
      section: null,
    },
  ],
};

vi.mock('../../src/house/api', () => ({
  getChecklist: vi.fn().mockResolvedValue(mockChecklist),
  updateChecklistItem: vi.fn().mockResolvedValue({ id: 10, ticked: true }),
  resetChecklist: vi.fn().mockResolvedValue({
    ...mockChecklist,
    items: mockChecklist.items.map((i) => ({ ...i, ticked: false })),
  }),
}));

vi.mock('../../src/store/appStore', () => ({
  default: vi.fn(() => ({ activeProfileId: null, adminPin: null })),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const ChecklistDetail = (await import('../../src/house/checklists/ChecklistDetail')).default;

describe('ChecklistDetail', () => {
  it('renders checklist items', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ChecklistDetail checklistId={1} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Brush teeth')).toBeInTheDocument();
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
    });
  });

  it('shows ticked state for completed items', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ChecklistDetail checklistId={1} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      const breakfastCheckbox = screen.getByTestId<HTMLInputElement>('checklist-item-11');
      expect(breakfastCheckbox.checked).toBe(true);
    });
  });

  it('shows Reset all button for daily_reset checklists', async () => {
    render(
      <QueryClientProvider client={makeQC()}>
        <ChecklistDetail checklistId={1} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });
  });

  it('calls updateChecklistItem when item is ticked', async () => {
    const { updateChecklistItem } = await import('../../src/house/api');
    render(
      <QueryClientProvider client={makeQC()}>
        <ChecklistDetail checklistId={1} />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Brush teeth')).toBeInTheDocument();
    });

    const checkbox = screen.getByTestId<HTMLInputElement>('checklist-item-10');
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(updateChecklistItem).toHaveBeenCalledWith(1, 10, { ticked: true });
    });
  });
});
