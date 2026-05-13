# STORY-3.5: Mini weather widget on home header

**Epic:** EPIC-3: Home Screen & Day Carousel
**Sprint:** 4 — Home Carousel + Calendar Views + CalDAV Sync
**Estimate:** S (1d)
**Priority:** P1
**Status:** completed

---

## User Story

**As a** household member
**I want** the home header to show current weather and key metrics
**So that** I can see conditions without opening anything

---

## Acceptance Criteria

- [x] Header weather inline: condition icon, current temp, high/low, precip %, UV index — pulled from `/api/v1/weather`
- [x] Tap → modal with 7-day forecast (cards per day with hi/lo/precip/icon)
- [x] Locale-aware temperature unit (°C/°F via `temperature_unit` app setting)
- [x] Loading skeleton while fetching
- [x] Error state shows "Weather unavailable" when fetch fails and no cache
- [x] WMO weather code mapped to Lucide icon + description string

---

## Technical Implementation

### Files to create / modify

- `client/src/home/MiniWeather.tsx`
- `client/src/home/WeatherModal.tsx`
- `client/src/home/api.ts` — `useWeather()`
- `client/src/utils/weatherCodes.ts` — WMO code → icon + i18n key
- `client/tests/home/MiniWeather.test.tsx`

### Implementation steps

1. `useWeather()` TanStack query with 5-minute staleTime, refetch on focus.
2. `<MiniWeather>` renders inline in the header (STORY-3.2):
```tsx
<button onClick={openModal} className="flex items-center gap-2">
  <WeatherIcon code={current.weather_code} />
  <span>{formatTemperature(current.temperature_2m)}</span>
  <span className="text-sm">↑{formatTemperature(daily[0].max)} ↓{formatTemperature(daily[0].min)}</span>
  <span className="text-sm">{daily[0].precip_max}% UV {current.uv_index}</span>
</button>
```
3. `<WeatherModal>`: 7-day grid of cards using `<Modal>` primitive.
4. WMO code mapping (subset):
```ts
export const weatherCodes: Record<number, { icon: string; key: string }> = {
  0: { icon: '☀️', key: 'weather.clear' },
  1: { icon: '🌤️', key: 'weather.mainlyClear' },
  2: { icon: '⛅', key: 'weather.partlyCloudy' },
  3: { icon: '☁️', key: 'weather.overcast' },
  // ...
};
```
5. Skeleton + error states.

### Key technical details

- PRD §9 weather mini-widget.
- WMO codes documented at https://open-meteo.com/en/docs (subset is fine; default to "—" icon if unknown).
- Use `WeatherIcon` SVG components instead of emojis if Inter doesn't render emojis well on the kiosk OS — pick from Lucide or `react-icons/wi`.
- All strings via i18n (STORY-18.1).

---

## Dependencies

- **Blocked by:** STORY-3.2, STORY-3.1
- **Blocks:** —

---

## Test Checklist

- [ ] RTL: renders temp, hi/lo, precip, UV
- [ ] RTL: tap opens modal with 7 days
- [ ] RTL: imperial units render °F
- [ ] RTL: error state visible when fetch fails
- [ ] RTL: skeleton while loading

---

## Notes

- UV index visibility: skip when undefined (winter mornings before forecast computed).
- The inline widget is small; the modal provides depth without being heavyweight.
