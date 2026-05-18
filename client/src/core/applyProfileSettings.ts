import type { Profile } from '../api/profiles';
import type { AppSettings } from './hooks/useAppSettings';

// eslint-disable-next-line import/prefer-default-export
export function applyProfileSettings(
  profile: Profile | null,
  globalSettings?: AppSettings | null,
): void {
  const root = document.documentElement;

  // Per-profile text-size and simplified-nav
  if (!profile) {
    delete root.dataset.textSize;
    delete root.dataset.simplifiedNav;
  } else {
    root.dataset.textSize = profile.text_size;
    root.dataset.simplifiedNav = String(profile.simplified_nav === 1);
  }

  // Global accessibility settings applied system-wide from app_settings
  if (globalSettings !== undefined) {
    root.dataset.highContrast = String(!!globalSettings?.high_contrast);
    root.dataset.reducedMotion = String(!!globalSettings?.reduced_motion_global);
    const cb = (globalSettings?.colour_blind_palette as string | undefined) ?? 'none';
    if (cb && cb !== 'none') {
      root.dataset.colourBlind = cb;
    } else {
      delete root.dataset.colourBlind;
    }
  }
}
