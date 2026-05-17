import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEnergySummary, getFuelRates, updateFuelRates } from '../api';

export function useEnergySummary() {
  return useQuery({
    queryKey: ['ev-energy-summary'],
    queryFn: getEnergySummary,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFuelRates() {
  return useQuery({
    queryKey: ['ev-fuel-rates'],
    queryFn: getFuelRates,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateFuelRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rates,
      effectiveDate,
      adminPin,
    }: {
      rates: { electricity?: number; gas?: number; oil?: number };
      effectiveDate?: string;
      adminPin: string;
    }) => updateFuelRates(rates, effectiveDate, adminPin),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ev-fuel-rates'] });
      void qc.invalidateQueries({ queryKey: ['ev-energy-summary'] });
    },
  });
}
