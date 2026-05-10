import { type Profile } from '../../api/profiles';
import useAppStore from '../../store/appStore';
import { useProfiles } from './useProfiles';

// eslint-disable-next-line import/prefer-default-export
export function useActiveProfile(): Profile | null {
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const { data: profiles } = useProfiles();
  if (!activeProfileId || !profiles) return null;
  return profiles.find((p) => String(p.id) === activeProfileId) ?? null;
}
