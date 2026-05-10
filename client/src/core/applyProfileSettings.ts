import type { Profile } from '../api/profiles';

// eslint-disable-next-line import/prefer-default-export
export function applyProfileSettings(profile: Profile | null): void {
  const root = document.documentElement;
  if (!profile) {
    delete root.dataset.textSize;
    delete root.dataset.simplifiedNav;
    return;
  }
  root.dataset.textSize = profile.text_size;
  root.dataset.simplifiedNav = String(profile.simplified_nav === 1);
}
