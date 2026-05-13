interface WeekHeaderProps {
  weekDays: Date[];
  todayMs: number;
}

export default function WeekHeader({ weekDays, todayMs }: WeekHeaderProps) {
  const isToday = (d: Date) => {
    const t = new Date(todayMs);
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  return (
    <div className="week-header" role="row">
      <div className="week-header__gutter" />
      {weekDays.map((day) => {
        const today = isToday(day);
        return (
          <div
            key={day.toISOString()}
            className={`week-header__cell${today ? ' week-header__cell--today' : ''}`}
            aria-current={today ? 'date' : undefined}
          >
            <span className="week-header__weekday">
              {new Intl.DateTimeFormat(navigator.language, { weekday: 'short' }).format(day)}
            </span>
            <span className="week-header__day-num">{day.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}
