const PRESETS = [
  { label: 'Does not repeat', value: '' },
  { label: 'Daily', value: 'FREQ=DAILY' },
  { label: 'Weekly', value: '__WEEKLY__' },
  { label: 'Monthly', value: '__MONTHLY__' },
  { label: 'Yearly', value: 'FREQ=YEARLY' },
];

const WEEKDAYS = [
  { short: 'MO', label: 'Mon' },
  { short: 'TU', label: 'Tue' },
  { short: 'WE', label: 'Wed' },
  { short: 'TH', label: 'Thu' },
  { short: 'FR', label: 'Fri' },
  { short: 'SA', label: 'Sat' },
  { short: 'SU', label: 'Sun' },
];

function dowFromDate(date: Date): string {
  const dow = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return dow[date.getDay()];
}

function buildWeeklyRule(byday: string): string {
  return `FREQ=WEEKLY;BYDAY=${byday}`;
}

function buildMonthlyRule(bymonthday: number): string {
  return `FREQ=MONTHLY;BYMONTHDAY=${bymonthday}`;
}

function detectPreset(rrule: string | undefined): string {
  if (!rrule) return '';
  if (rrule === 'FREQ=DAILY') return '__DAILY__';
  if (rrule.startsWith('FREQ=WEEKLY')) return '__WEEKLY__';
  if (rrule.startsWith('FREQ=MONTHLY')) return '__MONTHLY__';
  if (rrule === 'FREQ=YEARLY') return 'FREQ=YEARLY';
  return rrule;
}

interface RecurrencePickerProps {
  value: string | undefined;
  startDate?: Date;
  onChange: (rrule: string | undefined) => void;
}

export default function RecurrencePicker({ value, startDate, onChange }: RecurrencePickerProps) {
  const defaultDow = startDate ? dowFromDate(startDate) : 'MO';
  const defaultMonthDay = startDate ? startDate.getDate() : 1;

  // Determine the current select value
  let selectValue = '';
  if (!value) {
    selectValue = '';
  } else if (value === 'FREQ=DAILY') {
    selectValue = 'FREQ=DAILY';
  } else if (value.startsWith('FREQ=WEEKLY')) {
    selectValue = '__WEEKLY__';
  } else if (value.startsWith('FREQ=MONTHLY')) {
    selectValue = '__MONTHLY__';
  } else if (value === 'FREQ=YEARLY') {
    selectValue = 'FREQ=YEARLY';
  }

  // Extract BYDAY from current value for weekly
  let currentByday = defaultDow;
  if (value?.startsWith('FREQ=WEEKLY')) {
    const [, bydayCapture] = value.match(/BYDAY=([A-Z,]+)/) ?? [];
    if (bydayCapture) currentByday = bydayCapture;
  }

  // Extract BYMONTHDAY from current value for monthly
  let currentMonthDay = defaultMonthDay;
  if (value?.startsWith('FREQ=MONTHLY')) {
    const [, monthdayCapture] = value.match(/BYMONTHDAY=(\d+)/) ?? [];
    if (monthdayCapture) currentMonthDay = parseInt(monthdayCapture, 10);
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === '') {
      onChange(undefined);
    } else if (v === 'FREQ=DAILY') {
      onChange('FREQ=DAILY');
    } else if (v === '__WEEKLY__') {
      onChange(buildWeeklyRule(defaultDow));
    } else if (v === '__MONTHLY__') {
      onChange(buildMonthlyRule(defaultMonthDay));
    } else if (v === 'FREQ=YEARLY') {
      onChange('FREQ=YEARLY');
    }
  }

  return (
    <div className="recurrence-picker">
      <select
        className="recurrence-picker__select"
        value={selectValue}
        onChange={handleSelectChange}
        aria-label="Recurrence"
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {selectValue === '__WEEKLY__' && (
        <div className="recurrence-picker__weekdays">
          {WEEKDAYS.map((d) => (
            <button
              key={d.short}
              type="button"
              className={`recurrence-picker__day-chip${currentByday.includes(d.short) ? ' recurrence-picker__day-chip--active' : ''}`}
              onClick={() => {
                const days = currentByday.split(',');
                const next = days.includes(d.short)
                  ? days.filter((x) => x !== d.short)
                  : [...days, d.short];
                if (next.length > 0) onChange(buildWeeklyRule(next.join(',')));
              }}
              aria-pressed={currentByday.includes(d.short)}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {selectValue === '__MONTHLY__' && (
        <div className="recurrence-picker__monthly">
          <label className="recurrence-picker__label">
            Day of month:
            <input
              type="number"
              min={1}
              max={31}
              className="recurrence-picker__day-input"
              value={currentMonthDay}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (n >= 1 && n <= 31) onChange(buildMonthlyRule(n));
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

// Re-export for convenience
export { detectPreset };
