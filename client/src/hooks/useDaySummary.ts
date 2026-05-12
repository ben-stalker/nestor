import { useQuery } from '@tanstack/react-query';
import { getDaySummary, type DaySummary } from '../api/home';

export function daySummaryKey(date: string) {
  return ['day-summary', date] as const;
}

export function useDaySummary(date: string) {
  return useQuery<DaySummary>({
    queryKey: daySummaryKey(date),
    queryFn: () => getDaySummary(date),
    staleTime: 5 * 60 * 1000,
  });
}
