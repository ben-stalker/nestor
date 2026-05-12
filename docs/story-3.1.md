# STORY-3.1: Open-Meteo weather service + cache

**Status:** complete

## Tasks

- [ ] Create `WeatherService` class with `getForLocation` and `refresh` methods
- [ ] In-memory cache with timestamp; serve stale on error
- [ ] Alert via event bus if weather is down > 6h
- [ ] Wire scheduler `weather-refresh` job to `WeatherService.refresh()`
- [ ] `GET /api/v1/weather` endpoint returning cached data
- [ ] Unit tests with mocked HTTP fetch

## Progress

Starting implementation.
