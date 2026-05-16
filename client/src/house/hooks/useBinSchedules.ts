import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBinSchedules,
  getBinUpcoming,
  createBinSchedule,
  updateBinSchedule,
  deleteBinSchedule,
} from '../api';

export const BIN_SCHEDULES_KEY = ['bin-schedules'] as const;
export const BIN_UPCOMING_KEY = (days: number) => ['bin-schedules', 'upcoming', days] as const;

export function useBinSchedules() {
  return useQuery({
    queryKey: BIN_SCHEDULES_KEY,
    queryFn: getBinSchedules,
    staleTime: 60_000,
  });
}

export function useBinUpcoming(days = 14) {
  return useQuery({
    queryKey: BIN_UPCOMING_KEY(days),
    queryFn: () => getBinUpcoming(days),
    staleTime: 5 * 60_000,
  });
}

export function useCreateBinSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBinSchedule,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: BIN_SCHEDULES_KEY });
    },
  });
}

export function useUpdateBinSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: object }) => updateBinSchedule(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: BIN_SCHEDULES_KEY });
    },
  });
}

export function useDeleteBinSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBinSchedule,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: BIN_SCHEDULES_KEY });
    },
  });
}
