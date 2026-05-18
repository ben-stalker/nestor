import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfiles } from './hooks/useProfiles';
import { useAppSettings } from './hooks/useAppSettings';
import { applyProfileSettings } from './applyProfileSettings';
import useAppStore from '../store/appStore';
import { useActiveProfile } from './hooks/useActiveProfile';

function ProfileInitializer() {
  const { data: profiles } = useProfiles();
  const { data: globalSettings } = useAppSettings();
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const setActiveProfile = useAppStore((s) => s.setActiveProfile);
  const activeProfile = useActiveProfile();
  const queryClient = useQueryClient();

  // If no active profile is stored (or stored id no longer exists), pick first profile
  useEffect(() => {
    if (!profiles || profiles.length === 0) return;
    const storedExists = profiles.some((p) => String(p.id) === activeProfileId);
    if (!storedExists) {
      setActiveProfile(String(profiles[0].id));
    }
  }, [profiles, activeProfileId, setActiveProfile]);

  // Apply CSS data attributes whenever active profile or global a11y settings change
  useEffect(() => {
    applyProfileSettings(activeProfile, globalSettings);
  }, [activeProfile, globalSettings]);

  // Invalidate all queries when active profile changes so data re-fetches with new X-Profile-Id
  // queryClient is stable — intentionally omitted from deps
  useEffect(() => {
    if (activeProfileId) {
      void queryClient.invalidateQueries();
    }
  }, [activeProfileId, queryClient]);

  return null;
}

interface ProfileProviderProps {
  children: React.ReactNode;
}

export default function ProfileProvider({ children }: ProfileProviderProps) {
  return (
    <>
      <ProfileInitializer />
      {children}
    </>
  );
}
