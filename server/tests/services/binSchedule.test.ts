import { nextCollections } from '../../src/services/binSchedule';

// Monday 6 Jan 2025 as anchor (day_of_week = 1)
const MONDAY_JAN_6_2025 = new Date('2025-01-06T00:00:00.000Z').getTime();

describe('nextCollections — weekly schedule', () => {
  const schedule = {
    day_of_week: 1, // Monday
    frequency_weeks: 1 as const,
    anchor_date: MONDAY_JAN_6_2025,
    bank_holiday_shift: false,
  };

  it('returns N dates all on Mondays', () => {
    const from = new Date('2025-02-01T00:00:00.000Z');
    const dates = nextCollections(schedule, from, 7);
    expect(dates).toHaveLength(7);
    dates.forEach((d) => {
      expect(d.getUTCDay()).toBe(1);
    });
  });

  it('all dates are >= fromDate', () => {
    const from = new Date('2025-03-10T00:00:00.000Z');
    const dates = nextCollections(schedule, from, 4);
    dates.forEach((d) => {
      expect(d.getTime()).toBeGreaterThanOrEqual(from.getTime());
    });
  });
});

describe('nextCollections — fortnightly schedule', () => {
  const schedule = {
    day_of_week: 1, // Monday
    frequency_weeks: 2 as const,
    anchor_date: MONDAY_JAN_6_2025, // Week 1 collection
    bank_holiday_shift: false,
  };

  it('returns dates exactly 14 days apart', () => {
    const from = new Date('2025-02-01T00:00:00.000Z');
    const dates = nextCollections(schedule, from, 4);
    expect(dates).toHaveLength(4);
    dates.slice(1).forEach((d, idx) => {
      const diffDays = (d.getTime() - dates[idx].getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBe(14);
    });
  });

  it('all returned dates are on Mondays', () => {
    const from = new Date('2025-01-01T00:00:00.000Z');
    const dates = nextCollections(schedule, from, 6);
    dates.forEach((d) => {
      expect(d.getUTCDay()).toBe(1);
    });
  });
});

describe('nextCollections — every 4 weeks', () => {
  const schedule = {
    day_of_week: 1,
    frequency_weeks: 4 as const,
    anchor_date: MONDAY_JAN_6_2025,
    bank_holiday_shift: false,
  };

  it('returns dates exactly 28 days apart', () => {
    const from = new Date('2025-02-01T00:00:00.000Z');
    const dates = nextCollections(schedule, from, 3);
    expect(dates).toHaveLength(3);
    dates.slice(1).forEach((d, idx) => {
      const diffDays = (d.getTime() - dates[idx].getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBe(28);
    });
  });
});

describe('nextCollections — bank holiday shift', () => {
  // Christmas Day 2025 is 25 Dec (Thursday). If collection is on that day and shift=true, moves to 26 Dec.
  // We need a Thursday anchor in Dec 2025.
  const THURS_DEC_25_2025 = new Date('2025-12-25T00:00:00.000Z').getTime();

  it('shifts collection forward by 1 day when it falls on a bank holiday', () => {
    const schedule = {
      day_of_week: 4, // Thursday
      frequency_weeks: 1 as const,
      anchor_date: THURS_DEC_25_2025,
      bank_holiday_shift: true,
    };
    const from = new Date('2025-12-24T00:00:00.000Z');
    const dates = nextCollections(schedule, from, 1);
    expect(dates).toHaveLength(1);
    // Should be Boxing Day (26 Dec) not Christmas Day (25 Dec)
    expect(dates[0].getUTCDate()).toBe(26);
    expect(dates[0].getUTCMonth()).toBe(11); // December
  });

  it('does NOT shift when bank_holiday_shift is false', () => {
    const schedule = {
      day_of_week: 4, // Thursday
      frequency_weeks: 1 as const,
      anchor_date: THURS_DEC_25_2025,
      bank_holiday_shift: false,
    };
    const from = new Date('2025-12-24T00:00:00.000Z');
    const dates = nextCollections(schedule, from, 1);
    expect(dates).toHaveLength(1);
    // Stays on Christmas Day
    expect(dates[0].getUTCDate()).toBe(25);
  });
});

describe('nextCollections — edge cases', () => {
  it('returns 0 dates when count=0', () => {
    const schedule = {
      day_of_week: 1,
      frequency_weeks: 1 as const,
      anchor_date: MONDAY_JAN_6_2025,
      bank_holiday_shift: false,
    };
    const dates = nextCollections(schedule, new Date(), 0);
    expect(dates).toHaveLength(0);
  });

  it('includes anchor date itself if fromDate <= anchor', () => {
    const anchorDate = new Date('2025-01-06T00:00:00.000Z');
    const schedule = {
      day_of_week: 1,
      frequency_weeks: 1 as const,
      anchor_date: anchorDate.getTime(),
      bank_holiday_shift: false,
    };
    const from = new Date('2025-01-05T00:00:00.000Z'); // day before anchor
    const dates = nextCollections(schedule, from, 1);
    expect(dates[0].getUTCDate()).toBe(6);
  });

  it('works with future anchor date', () => {
    const futureAnchor = new Date('2027-06-07T00:00:00.000Z').getTime(); // Monday
    const schedule = {
      day_of_week: 1,
      frequency_weeks: 2 as const,
      anchor_date: futureAnchor,
      bank_holiday_shift: false,
    };
    const from = new Date('2027-05-01T00:00:00.000Z');
    const dates = nextCollections(schedule, from, 3);
    expect(dates).toHaveLength(3);
    dates.slice(1).forEach((d, idx) => {
      const diff = (d.getTime() - dates[idx].getTime()) / (24 * 60 * 60 * 1000);
      expect(diff).toBe(14);
    });
  });
});
