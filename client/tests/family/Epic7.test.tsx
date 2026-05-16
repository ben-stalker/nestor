import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  ApiError: class extends Error {
    status = 0;
  },
}));

vi.mock('../../src/family/api', () => ({
  getBabySummary: vi.fn().mockResolvedValue({
    todayFeedCount: 3,
    todayNappyCount: 2,
    lastFeedMs: Date.now() - 3_600_000,
    lastSleepEntry: null,
    recentEntries: [],
  }),
  createHealthLog: vi
    .fn()
    .mockResolvedValue({ id: 1, log_type: 'feed', data_json: {}, logged_at: Date.now() }),
  getHealthLog: vi.fn().mockResolvedValue([]),
  getChores: vi.fn().mockResolvedValue([]),
  getRewardGrid: vi.fn().mockResolvedValue({
    filled: 3,
    total: 10,
    totalEarned: 13,
    streak: 2,
    conversionRate: 0.1,
    moneyEquivalent: 1.3,
  }),
  getFamilySummary: vi.fn().mockResolvedValue([]),
  getGrowthData: vi.fn().mockResolvedValue({ dobMs: null, points: [] }),
  getVaccinations: vi.fn().mockResolvedValue([]),
  getMoodTrend: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/house/api', () => ({
  getChecklists: vi.fn().mockResolvedValue([]),
  getChecklist: vi
    .fn()
    .mockResolvedValue({ id: 1, name: 'Morning Routine', type: 'daily_reset', items: [] }),
  updateChecklistItem: vi.fn().mockResolvedValue({}),
}));

vi.mock('framer-motion', () => ({
  motion: { div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} /> },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrap(ui: React.ReactElement) {
  return <QueryClientProvider client={makeQC()}>{ui}</QueryClientProvider>;
}

const BABY_PROFILE = {
  id: 42,
  name: 'Rosie',
  type: 'baby' as const,
  colour: '#aabbcc',
  pinSet: false,
  avatar_path: null,
  accessibility_json: null,
  permissions_json: {} as never,
  text_size: 'default' as const,
  simplified_nav: 0,
  term_dates_ical_url: null,
  dob: null,
  feed_alert_hours: 4,
  conversion_rate: 0,
  created_at: Date.now(),
};

// ─── BabyView ─────────────────────────────────────────────────────────────────

describe('BabyView', () => {
  it('renders feed/nappy/sleep quick-log sections', async () => {
    const BabyView = (await import('../../src/family/BabyView')).default;
    render(wrap(<BabyView profile={BABY_PROFILE} />));
    expect(await screen.findByText('Feed')).toBeDefined();
    expect(screen.getByText('Nappy')).toBeDefined();
    expect(screen.getByText('Sleep')).toBeDefined();
  });

  it('shows today feed and nappy counts from summary', async () => {
    const BabyView = (await import('../../src/family/BabyView')).default;
    render(wrap(<BabyView profile={BABY_PROFILE} />));
    expect(await screen.findByText('3')).toBeDefined();
    expect(screen.getByText('feeds today')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('nappies today')).toBeDefined();
  });

  it('shows Left, Right, Bottle feed buttons', async () => {
    const BabyView = (await import('../../src/family/BabyView')).default;
    render(wrap(<BabyView profile={BABY_PROFILE} />));
    expect(await screen.findByText('Left')).toBeDefined();
    expect(screen.getByText('Right')).toBeDefined();
    expect(screen.getByText('Bottle')).toBeDefined();
  });

  it('shows Wet, Dirty, Both nappy buttons', async () => {
    const BabyView = (await import('../../src/family/BabyView')).default;
    render(wrap(<BabyView profile={BABY_PROFILE} />));
    expect(await screen.findByText('Wet')).toBeDefined();
    expect(screen.getByText('Dirty')).toBeDefined();
    expect(screen.getByText('Both')).toBeDefined();
  });
});

// ─── GrowthChart ─────────────────────────────────────────────────────────────

describe('GrowthChart', () => {
  it('shows empty state when no growth points', async () => {
    const GrowthChart = (await import('../../src/family/GrowthChart')).default;
    render(wrap(<GrowthChart profileId={42} />));
    expect(await screen.findByText(/no growth data/i)).toBeDefined();
  });
});

// ─── VaccinationSchedule ─────────────────────────────────────────────────────

describe('VaccinationSchedule', () => {
  it('shows empty state when no dob set', async () => {
    const VaccinationSchedule = (await import('../../src/family/VaccinationSchedule')).default;
    render(wrap(<VaccinationSchedule profileId={42} />));
    expect(await screen.findByText(/no vaccination schedule/i)).toBeDefined();
  });
});

// ─── RoutinesPanel ───────────────────────────────────────────────────────────

describe('RoutinesPanel', () => {
  it('shows empty state when no routine checklists found', async () => {
    const RoutinesPanel = (await import('../../src/family/RoutinesPanel')).default;
    render(wrap(<RoutinesPanel profileName="Lily" />));
    expect(await screen.findByText(/no routines found/i)).toBeDefined();
  });
});

// ─── MoodCheckin ─────────────────────────────────────────────────────────────

describe('MoodCheckin', () => {
  it('renders 5 emoji buttons', async () => {
    const MoodCheckin = (await import('../../src/family/MoodCheckin')).default;
    render(wrap(<MoodCheckin profileId={43} />));
    expect(await screen.findByText('😢')).toBeDefined();
    expect(screen.getByText('😞')).toBeDefined();
    expect(screen.getByText('😐')).toBeDefined();
    expect(screen.getByText('🙂')).toBeDefined();
    expect(screen.getByText('😄')).toBeDefined();
  });

  it('shows title prompt', async () => {
    const MoodCheckin = (await import('../../src/family/MoodCheckin')).default;
    render(wrap(<MoodCheckin profileId={43} />));
    expect(await screen.findByText(/how are you feeling/i)).toBeDefined();
  });
});

// ─── MoodTrend ───────────────────────────────────────────────────────────────

describe('MoodTrend', () => {
  it('shows empty state when no entries', async () => {
    const MoodTrend = (await import('../../src/family/MoodTrend')).default;
    render(wrap(<MoodTrend profileId={43} />));
    expect(await screen.findByText(/no mood entries/i)).toBeDefined();
  });
});

// ─── RewardStarGrid — allowance (STORY-7.12) ─────────────────────────────────

describe('RewardStarGrid allowance display', () => {
  it('shows money equivalent when conversion_rate > 0', async () => {
    const RewardStarGrid = (await import('../../src/me/RewardStarGrid')).default;
    render(wrap(<RewardStarGrid profileId={43} />));
    const el = await screen.findByLabelText(/points money value/i);
    expect(el).toBeDefined();
  });
});
