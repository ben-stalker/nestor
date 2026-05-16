export interface BinSchedule {
  day_of_week: number;
  frequency_weeks: 1 | 2 | 4;
  anchor_date: number;
  bank_holiday_shift: boolean;
}

// England bank holidays 2024-2027 (observed dates)
const UK_BANK_HOLIDAYS = new Set([
  // 2024
  '2024-01-01', // New Year's Day
  '2024-03-29', // Good Friday
  '2024-04-01', // Easter Monday
  '2024-05-06', // Early May Bank Holiday
  '2024-05-27', // Spring Bank Holiday
  '2024-08-26', // Summer Bank Holiday
  '2024-12-25', // Christmas Day
  '2024-12-26', // Boxing Day
  // 2025
  '2025-01-01', // New Year's Day
  '2025-04-18', // Good Friday
  '2025-04-21', // Easter Monday
  '2025-05-05', // Early May Bank Holiday
  '2025-05-26', // Spring Bank Holiday
  '2025-08-25', // Summer Bank Holiday
  '2025-12-25', // Christmas Day
  '2025-12-26', // Boxing Day
  // 2026
  '2026-01-01', // New Year's Day
  '2026-04-03', // Good Friday
  '2026-04-06', // Easter Monday
  '2026-05-04', // Early May Bank Holiday
  '2026-05-25', // Spring Bank Holiday
  '2026-08-31', // Summer Bank Holiday
  '2026-12-25', // Christmas Day
  '2026-12-28', // Boxing Day (substitute, 25 Dec is Friday but 26 is Sat → 28 Mon)
  // 2027
  '2027-01-01', // New Year's Day
  '2027-03-26', // Good Friday
  '2027-03-29', // Easter Monday
  '2027-05-03', // Early May Bank Holiday
  '2027-05-31', // Spring Bank Holiday
  '2027-08-30', // Summer Bank Holiday
  '2027-12-27', // Christmas Day (substitute, 25 Dec is Sat → 27 Mon)
  '2027-12-28', // Boxing Day (substitute, 26 Dec is Sun → 28 Tue)
]);

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isBankHoliday(d: Date): boolean {
  return UK_BANK_HOLIDAYS.has(toDateStr(d));
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Returns the next `count` collection dates for a bin schedule, starting from or after `fromDate`.
 * The anchor_date is a known past (or present) collection date on the correct day_of_week.
 */
export function nextCollections(schedule: BinSchedule, fromDate: Date, count: number): Date[] {
  const results: Date[] = [];
  const from = startOfDay(fromDate);

  // Find the week-start (Sunday) of the anchor date's ISO week
  const anchor = startOfDay(new Date(schedule.anchor_date));

  // How many ms in one cycle
  const cycleMs = schedule.frequency_weeks * 7 * 24 * 60 * 60 * 1000;

  // Find the first cycle-week that contains or comes after `from`
  // Work backwards from anchor to epoch, then forward to find current cycle
  let cycleStart: Date;

  if (anchor >= from) {
    // Anchor is in future; walk backwards to find cycle containing `from`
    cycleStart = new Date(anchor);
    while (new Date(cycleStart.getTime() - cycleMs) >= from) {
      cycleStart = new Date(cycleStart.getTime() - cycleMs);
    }
    // Now cycleStart is the last cycle that starts on or before from (or anchor)
    if (new Date(cycleStart.getTime() + 6 * 24 * 60 * 60 * 1000) < from) {
      cycleStart = new Date(cycleStart.getTime() + cycleMs);
    }
  } else {
    // Anchor is in past; walk forward
    cycleStart = new Date(anchor);
    while (new Date(cycleStart.getTime() + cycleMs) <= from) {
      cycleStart = new Date(cycleStart.getTime() + cycleMs);
    }
  }

  // Each cycle, compute the collection date (day_of_week within that cycle's week)
  // The anchor is on day_of_week. We treat the cycle start as Monday-aligned week
  // Simplest: since anchor IS a collection date, each subsequent cycle starts cycleMs later
  // The collection date within the cycle is: cycleStart + offset to reach day_of_week
  // But anchor_date itself is on day_of_week, so we use anchor as the first collection date
  // and add multiples of cycleMs.

  // Find the first collection date >= from by starting at anchor and stepping
  let collectionDate = new Date(anchor);

  // Step forward until collectionDate >= from
  while (collectionDate < from) {
    collectionDate = new Date(collectionDate.getTime() + cycleMs);
  }
  // Step backward if we overshot (in case anchor > from and previous cycle is closer)
  while (new Date(collectionDate.getTime() - cycleMs) >= from) {
    collectionDate = new Date(collectionDate.getTime() - cycleMs);
  }

  while (results.length < count) {
    let candidate = new Date(collectionDate);

    if (schedule.bank_holiday_shift && isBankHoliday(candidate)) {
      candidate = new Date(candidate.getTime() + 24 * 60 * 60 * 1000);
    }

    if (candidate >= from) {
      results.push(candidate);
    }

    collectionDate = new Date(collectionDate.getTime() + cycleMs);
  }

  return results;
}
