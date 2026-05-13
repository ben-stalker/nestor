import { describe, expect, it } from 'vitest';
import { layoutOverlaps } from '../../src/calendar/layoutOverlaps';

function ev(id: number, start: number, end: number) {
  return { id, start_datetime: start, end_datetime: end };
}

describe('layoutOverlaps', () => {
  it('returns empty array for no events', () => {
    expect(layoutOverlaps([])).toEqual([]);
  });

  it('single event gets column 0 and totalColumns 1', () => {
    const result = layoutOverlaps([ev(1, 100, 200)]);
    expect(result).toHaveLength(1);
    expect(result[0].column).toBe(0);
    expect(result[0].totalColumns).toBe(1);
  });

  it('two non-overlapping events share column 0', () => {
    const result = layoutOverlaps([ev(1, 100, 200), ev(2, 300, 400)]);
    expect(result[0].column).toBe(0);
    expect(result[1].column).toBe(0);
    expect(result[0].totalColumns).toBe(1);
    expect(result[1].totalColumns).toBe(1);
  });

  it('two overlapping events get different columns', () => {
    const result = layoutOverlaps([ev(1, 100, 300), ev(2, 150, 350)]);
    const cols = result.map((r) => r.column).sort();
    expect(cols).toEqual([0, 1]);
    expect(result[0].totalColumns).toBe(2);
    expect(result[1].totalColumns).toBe(2);
  });

  it('three mutually overlapping events get columns 0, 1, 2', () => {
    const result = layoutOverlaps([ev(1, 100, 400), ev(2, 150, 450), ev(3, 200, 500)]);
    const cols = result.map((r) => r.column).sort();
    expect(cols).toEqual([0, 1, 2]);
    expect(result.every((r) => r.totalColumns === 3)).toBe(true);
  });

  it('events touching at boundaries (adjacent) do not overlap', () => {
    const result = layoutOverlaps([ev(1, 100, 200), ev(2, 200, 300)]);
    expect(result[0].column).toBe(0);
    expect(result[1].column).toBe(0);
    expect(result[0].totalColumns).toBe(1);
  });

  it('sorts events by start time before assigning columns', () => {
    const result = layoutOverlaps([ev(2, 150, 250), ev(1, 100, 200)]);
    const sorted = result.sort((a, b) => a.event.start_datetime - b.event.start_datetime);
    expect(sorted[0].event.id).toBe(1);
    expect(sorted[1].event.id).toBe(2);
  });
});
