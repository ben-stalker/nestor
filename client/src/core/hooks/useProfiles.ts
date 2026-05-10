import { useQuery } from '@tanstack/react-query';
import { getProfiles } from '../../api/profiles';

export const PROFILES_KEY = ['profiles'] as const;

export function useProfiles() {
  return useQuery({
    queryKey: PROFILES_KEY,
    queryFn: getProfiles,
    staleTime: 60_000,
  });
}
