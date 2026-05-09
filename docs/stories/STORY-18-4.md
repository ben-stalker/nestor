# STORY-18.4: Accessibility tokens + per-profile text size

**Epic:** EPIC-18: Internationalisation & Accessibility
**Sprint:** 3 — Calendar Core + Home Skeleton
**Estimate:** M (2d)
**Priority:** P1
**Status:** pending

---

## User Story

**As a** developer
**I want** the design system to honour `--base-font-size` per profile
**So that** grandparent profiles see larger text

---

## Acceptance Criteria

- [ ] CSS custom property `--base-font-size` set on `<html>` from active profile (defaults `18px`, sizes `S/M/L/XL` map to `16/18/20/24`)
- [ ] All typography sizes use `rem` units only — no hardcoded `px` font sizes
- [ ] High-contrast (`html.high-contrast`) and colour-blind (`html.cb-palette`) palette CSS classes toggle alternate Tailwind layer
- [ ] Reduced-motion (`html.reduced-motion`) swaps Framer Motion springs for instant
- [ ] `<TouchTarget>` enforces 44×44 minimum and applies `min-w-[44px] min-h-[44px]` class
- [ ] Active profile's `text_size` and `simplified_nav` flags applied as a side effect of `<ProfileProvider>` (STORY-2.8)
- [ ] Lint rule against px font sizes in component CSS

---

## Technical Implementation

### Files to create / modify

- `client/src/styles/tokens.css` — root tokens
- `client/tailwind.config.ts` — `theme.fontSize` keys reference rem
- `client/src/core/ProfileProvider.tsx` — set `<html>` classes/properties
- `client/src/shared/ui/TouchTarget.tsx`
- `.eslintrc.json` — `no-restricted-syntax` for px font sizes
- `client/tests/a11y/tokens.test.tsx`

### Implementation steps

1. Define tokens in `tokens.css`:
```css
:root { --base-font-size: 18px; }
html.text-sm { --base-font-size: 16px; }
html.text-md { --base-font-size: 18px; }
html.text-lg { --base-font-size: 20px; }
html.text-xl { --base-font-size: 24px; }
html { font-size: var(--base-font-size); }
```
2. Tailwind: keep default `text-base` -> `1rem`, etc. Update `display`/`h1`/`h2` tokens to use `rem`.
3. `ProfileProvider`:
```ts
useEffect(() => {
  const html = document.documentElement;
  html.classList.remove('text-sm','text-md','text-lg','text-xl');
  html.classList.add(`text-${profile.text_size ?? 'md'}`);
  html.classList.toggle('reduced-motion', appSettings.reducedMotion);
  html.classList.toggle('high-contrast', appSettings.highContrast);
  html.classList.toggle('cb-palette', appSettings.colourBlindPalette);
}, [profile, appSettings]);
```
4. `<TouchTarget>` wrapper:
```tsx
export function TouchTarget({ children, className, ...rest }) {
  return <div className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${className ?? ''}`} {...rest}>{children}</div>;
}
```
5. Reduced-motion: in `framer-motion`, wrap transitions in `useReducedMotion()` or globally with a context that swaps spring → `tween 0`.
6. Lint rule for px font sizes:
```json
{ "selector": "Literal[value=/^.*[0-9]+px$/]", "message": "Use rem-based font sizes" }
```
   Override for non-font properties via comment escape hatches.
7. Tests: render a component with `<ProfileProvider profile={{ text_size: 'xl' }}>`, assert `html.text-xl` class present.

### Key technical details

- Architecture NFR-006 (a11y).
- Tailwind `rem` strategy keeps everything proportional to `--base-font-size`; no per-component overrides needed.
- High-contrast palette uses CSS variables instead of class swapping where possible (instant switch, no re-render).
- `prefers-reduced-motion` media query also respected — `html.reduced-motion` is a manual override.

---

## Dependencies

- **Blocked by:** STORY-2.5
- **Blocks:** STORY-17.8 (a11y admin panel writes these settings), STORY-18.7 (colour-blind palette), STORY-18.8 (simplified nav)

---

## Test Checklist

- [ ] Unit: profile with text_size=xl → html has `text-xl` class
- [ ] Unit: switching profile updates html class
- [ ] Unit: TouchTarget renders with min-w-44 min-h-44
- [ ] Unit: reduced-motion class disables Framer animations
- [ ] Manual: with text_size=xl, body text visibly larger
- [ ] Manual: with high-contrast, contrast meets WCAG AA
- [ ] Lint: px font size in a component fails ESLint

---

## Notes

- Future: per-profile `font-family` override (dyslexia-friendly fonts) — out of scope for MVP.
- Reduced-motion overrides global animations; module-specific motion (e.g. carousel snap) reads the same flag.
