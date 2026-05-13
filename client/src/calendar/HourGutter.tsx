export const PX_PER_HOUR = 64;
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;

const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => i + DAY_START_HOUR);

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function HourGutter() {
  return (
    <div className="hour-gutter" aria-hidden="true">
      {HOURS.map((hour) => (
        <div key={hour} className="hour-gutter__label" style={{ height: PX_PER_HOUR }}>
          {`${pad(hour)}:00`}
        </div>
      ))}
    </div>
  );
}
