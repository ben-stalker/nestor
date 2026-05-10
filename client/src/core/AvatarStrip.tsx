import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useProfiles, PROFILES_KEY } from './hooks/useProfiles';
import { useAppSettings } from './hooks/useAppSettings';
import { applyProfileSettings } from './applyProfileSettings';
import useAppStore from '../store/appStore';
import Avatar from '../shared/ui/Avatar';
import PinPrompt from './PinPrompt';
import type { Profile } from '../api/profiles';

export default function AvatarStrip() {
  const { data: profiles, isLoading } = useProfiles();
  const { data: settings } = useAppSettings();
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const setActiveProfile = useAppStore((s) => s.setActiveProfile);
  const setGuestMode = useAppStore((s) => s.setGuestMode);
  const queryClient = useQueryClient();
  const [pinTarget, setPinTarget] = useState<Profile | null>(null);
  const isKioskLocked = Boolean(settings?.kiosk_lock);

  function switchTo(profile: Profile) {
    setActiveProfile(String(profile.id));
    void queryClient.invalidateQueries({ queryKey: PROFILES_KEY, refetchType: 'none' });
    void queryClient.invalidateQueries();
    applyProfileSettings(profile);
  }

  function handleAvatarClick(profile: Profile) {
    if (profile.type === 'guest') {
      if (profile.pinSet) {
        setPinTarget(profile);
      } else {
        setGuestMode(String(profile.id));
      }
      return;
    }
    if (profile.pinSet) {
      setPinTarget(profile);
    } else {
      switchTo(profile);
    }
  }

  function handlePinSuccess(profile: Profile) {
    setPinTarget(null);
    if (profile.type === 'guest') {
      setGuestMode(String(profile.id));
    } else {
      switchTo(profile);
    }
  }

  if (isLoading || !profiles) {
    return (
      <div className="avatar-strip" aria-label="Profile switcher">
        {[1, 2, 3].map((i) => (
          <div key={i} className="avatar-strip__item">
            <span className="inline-block h-11 w-11 animate-pulse rounded-full bg-surface-elev" />
            <span className="mt-1 h-3 w-10 animate-pulse rounded bg-surface-elev" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        className={clsx('avatar-strip', isKioskLocked && 'avatar-strip--locked')}
        aria-label="Profile switcher"
        aria-disabled={isKioskLocked || undefined}
        role="toolbar"
      >
        {profiles.map((profile) => {
          const isActive = String(profile.id) === activeProfileId;
          return (
            <button
              key={profile.id}
              type="button"
              aria-label={`Switch to ${profile.name}${isActive ? ' (active)' : ''}`}
              aria-pressed={isActive}
              onClick={() => handleAvatarClick(profile)}
              className={clsx('avatar-strip__item', isActive && 'avatar-strip__item--active')}
            >
              <Avatar
                name={profile.name}
                colour={profile.colour}
                size="md"
                className={clsx(isActive ? 'border-4' : 'border-2')}
              />
              <span
                className={clsx(
                  'mt-1 text-caption leading-tight',
                  isActive ? 'font-semibold text-primary' : 'text-secondary',
                )}
              >
                {profile.name}
              </span>
            </button>
          );
        })}
      </div>

      {pinTarget && (
        <PinPrompt
          profile={pinTarget}
          onSuccess={() => handlePinSuccess(pinTarget)}
          onClose={() => setPinTarget(null)}
        />
      )}
    </>
  );
}
