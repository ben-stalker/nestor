import { useQuery } from '@tanstack/react-query';
import { getWeather, type WeatherData } from '../api/weather';

export const WEATHER_KEY = ['weather'] as const;

export function useWeather() {
  return useQuery<WeatherData>({
    queryKey: WEATHER_KEY,
    queryFn: getWeather,
    staleTime: 25 * 60 * 1000, // 25 min — refresh before 30-min server cache expires
    retry: 1,
  });
}
