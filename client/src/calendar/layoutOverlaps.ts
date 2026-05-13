export interface LayoutItem<E extends { start_datetime: number; end_datetime: number }> {
  event: E;
  column: number;
  totalColumns: number;
}

export function layoutOverlaps<E extends { start_datetime: number; end_datetime: number }>(
  events: E[],
): LayoutItem<E>[] {
  const sorted = [...events].sort((a, b) => a.start_datetime - b.start_datetime);
  const columnEnds: number[] = [];

  const assignments = sorted.map((event) => {
    const col = columnEnds.findIndex((colEnd) => colEnd <= event.start_datetime);
    const assignedCol = col === -1 ? columnEnds.length : col;
    if (assignedCol === columnEnds.length) {
      columnEnds.push(event.end_datetime);
    } else {
      columnEnds[assignedCol] = Math.max(columnEnds[assignedCol], event.end_datetime);
    }
    return { event, column: assignedCol };
  });

  return assignments.map((item) => {
    const totalColumns = assignments.reduce((max, other) => {
      const overlaps =
        other.event.start_datetime < item.event.end_datetime &&
        other.event.end_datetime > item.event.start_datetime;
      return overlaps ? Math.max(max, other.column + 1) : max;
    }, item.column + 1);
    return { ...item, totalColumns };
  });
}
