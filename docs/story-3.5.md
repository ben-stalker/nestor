# STORY-3.5: Mini weather widget on home header

**Status:** complete

## Tasks

- [ ] Add `uv_index_max` to WeatherDaily on server (WeatherService.ts)
- [ ] Add `temperature_unit` setting to settings-keys.ts
- [ ] Add `uv_index_max` to WeatherDaily on client (api/weather.ts)
- [ ] Enhance HomeHeader weather section: precip %, UV index display
- [ ] Create WeatherModal with 7-day forecast (tap to open)
- [ ] Locale-aware temperature unit (°C/°F) via app_settings
- [ ] Tests

## Notes

- UV index pulled from daily.uv_index_max[0]
- Precipitation probability from daily.precipitation_probability_max[0]
- Temperature conversion done client-side (cache stays in °C)
- Modal shows 7-day forecast: icon, day name, high/low, precip %
