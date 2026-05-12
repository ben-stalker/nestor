import { useQuery } from '@tanstack/react-query';
import { getJourneyEtas, type JourneyEta } from '../api/journeys';
import { useActiveProfile } from '../core/hooks/useActiveProfile';

export const JOURNEY_ETAS_KEY = (profileId: number) => ['journey-etas', profileId] as const;

export function useJourneyEtas() {
  const profile = useActiveProfile();
  const profileId = profile ? Number(profile.id) : null;

  return useQuery<JourneyEta[]>({
    queryKey: profileId != null ? JOURNEY_ETAS_KEY(profileId) : ['journey-etas-none'],
    queryFn: () => getJourneyEtas(profileId!),
    enabled: profileId != null,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
