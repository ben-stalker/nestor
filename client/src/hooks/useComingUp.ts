import { useQuery } from '@tanstack/react-query';
import { getComingUp, type ComingUpResponse } from '../api/comingUp';

export const COMING_UP_KEY = ['coming-up'] as const;

export function useComingUp() {
  return useQuery<ComingUpResponse>({
    queryKey: COMING_UP_KEY,
    queryFn: getComingUp,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
