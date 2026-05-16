import { useQuery } from '@tanstack/react-query';
import { listPets } from '../api';

export default function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: listPets,
    staleTime: 60_000,
  });
}
