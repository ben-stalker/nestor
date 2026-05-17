import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listChargingLogs,
  createChargingLog,
  updateChargingLog,
  deleteChargingLog,
  getMonthlyTotals,
} from '../api';
import type { EvChargingLogInput, EvChargingLogUpdate } from '../types';

export function useChargingLogs(vehicleId?: number) {
  return useQuery({
    queryKey: ['ev-charging', vehicleId],
    queryFn: () => listChargingLogs(vehicleId),
  });
}

export function useMonthlyTotals(vehicleId?: number) {
  return useQuery({
    queryKey: ['ev-monthly', vehicleId],
    queryFn: () => getMonthlyTotals(vehicleId),
  });
}

export function useCreateChargingLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EvChargingLogInput) => createChargingLog(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ev-charging'] });
    },
  });
}

export function useUpdateChargingLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: EvChargingLogUpdate }) =>
      updateChargingLog(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ev-charging'] });
    },
  });
}

export function useDeleteChargingLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminPin }: { id: number; adminPin: string }) =>
      deleteChargingLog(id, adminPin),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ev-charging'] });
    },
  });
}
