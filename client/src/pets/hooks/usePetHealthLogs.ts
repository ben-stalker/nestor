import { useQuery } from '@tanstack/react-query';
import { listHealthLogs } from '../api';

export default function usePetHealthLogs(petId: number) {
  return useQuery({
    queryKey: ['pet-health-logs', petId],
    queryFn: () => listHealthLogs(petId),
    enabled: petId > 0,
    staleTime: 60_000,
  });
}
