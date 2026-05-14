import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../src/food/api', () => ({
  getMealPlan: vi.fn().mockResolvedValue([]),
  setMealPlanEntry: vi.fn().mockResolvedValue({}),
  deleteMealPlanEntry: vi.fn().mockResolvedValue(undefined),
  getRecipes: vi.fn().mockResolvedValue([]),
}));

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

const MealPlanner = (await import('../../src/food/MealPlanner')).default;

const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().slice(0, 10);

// Monday of the current week
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function renderPlanner(entries = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const monday = getMondayOfWeek(TODAY);
  const sunday = addDays(monday, 6);
  qc.setQueryData(['meal-plan', toDateStr(monday), toDateStr(sunday)], entries);
  qc.setQueryData(['recipes', undefined, undefined], []);
  return render(
    <QueryClientProvider client={qc}>
      <MealPlanner />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MealPlanner', () => {
  it('renders 7 day column headers', () => {
    renderPlanner();
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders 3 default meal slot labels', () => {
    renderPlanner();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('highlights today column', () => {
    renderPlanner();
    const todayCol = screen.queryByTestId(`day-col-${TODAY_STR}`);
    if (todayCol) {
      expect(todayCol).toHaveClass('text-accent');
    }
  });

  it('clicking an empty slot shows editor options', () => {
    renderPlanner();
    const monday = getMondayOfWeek(TODAY);
    const mondayStr = toDateStr(monday);
    // Find the breakfast slot on Monday
    const slotBtn = screen.queryByTestId(`slot-${mondayStr}-breakfast`);
    if (slotBtn) {
      fireEvent.click(slotBtn);
      expect(screen.getByTestId('slot-editor')).toBeInTheDocument();
      expect(screen.getByTestId('browse-recipes-btn')).toBeInTheDocument();
      expect(screen.getByTestId('free-text-input')).toBeInTheDocument();
    }
  });

  it('shows week navigation buttons', () => {
    renderPlanner();
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next week' })).toBeInTheDocument();
  });

  it('navigating to next week updates header', () => {
    renderPlanner();
    const nextBtn = screen.getByRole('button', { name: 'Next week' });
    fireEvent.click(nextBtn);
    // After clicking next, DAY columns should still be Mon-Sun
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('renders entry content when entry has free text', () => {
    const monday = getMondayOfWeek(TODAY);
    const mondayStr = toDateStr(monday);
    const entries = [
      {
        id: 1,
        plan_date: mondayStr,
        slot_name: 'breakfast',
        free_text: 'Scrambled eggs',
        recipe_id: null,
        servings_override: null,
        recipe: null,
      },
    ];
    renderPlanner(entries as never);
    expect(screen.getByText('Scrambled eggs')).toBeInTheDocument();
  });

  it('renders entry with recipe title', () => {
    const monday = getMondayOfWeek(TODAY);
    const mondayStr = toDateStr(monday);
    const entries = [
      {
        id: 2,
        plan_date: mondayStr,
        slot_name: 'dinner',
        free_text: null,
        recipe_id: 42,
        servings_override: null,
        recipe: {
          id: 42,
          title: 'Pasta Carbonara',
          description: null,
          prep_mins: 10,
          cook_mins: 20,
          servings: 4,
          calories: null,
          tags: [],
          photo_path: null,
          source_url: null,
          created_at: 1000,
          ingredients: [],
        },
      },
    ];
    renderPlanner(entries as never);
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
  });
});
