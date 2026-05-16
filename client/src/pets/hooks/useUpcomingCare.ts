import { useQuery } from '@tanstack/react-query';
import { getUpcomingCare } from '../api';

export default function useUpcomingCare(days = 30) {
  return useQuery({
    queryKey: ['pets-upcoming-care', days],
    queryFn: () => getUpcomingCare(days),
    staleTime: 60_000,
  });
}
