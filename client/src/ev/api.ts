import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '../api/client';
import type {
  EvChargingLog,
  MonthlyEvSummary,
  EnergySummary,
  FuelRates,
  EvChargingLogInput,
  EvChargingLogUpdate,
  OctopusStatus,
  OctopusCredentialResult,
} from './types';

export async function listChargingLogs(vehicleId?: number): Promise<EvChargingLog[]> {
  const params = vehicleId !== undefined ? `?vehicleId=${vehicleId}` : '';
  return apiFetch<EvChargingLog[]>(`/api/v1/ev/charging-log${params}`);
}

export async function createChargingLog(input: EvChargingLogInput): Promise<EvChargingLog> {
  return apiFetch<EvChargingLog>('/api/v1/ev/charging-log', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateChargingLog(
  id: number,
  patch: EvChargingLogUpdate,
): Promise<EvChargingLog> {
  return apiFetch<EvChargingLog>(`/api/v1/ev/charging-log/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteChargingLog(id: number, adminPin: string): Promise<void> {
  await apiFetch<void>(`/api/v1/ev/charging-log/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Pin': adminPin },
  });
}

export async function getMonthlyTotals(vehicleId?: number): Promise<MonthlyEvSummary[]> {
  const params = vehicleId !== undefined ? `?vehicleId=${vehicleId}` : '';
  return apiFetch<MonthlyEvSummary[]>(`/api/v1/ev/monthly-totals${params}`);
}

export async function getEnergySummary(): Promise<EnergySummary> {
  return apiFetch<EnergySummary>('/api/v1/ev/energy-summary');
}

export async function getFuelRates(): Promise<FuelRates> {
  return apiFetch<FuelRates>('/api/v1/ev/fuel-rates');
}

export async function updateFuelRates(
  rates: { electricity?: number; gas?: number; oil?: number },
  effective_date?: string,
  adminPin?: string,
): Promise<{ current: Record<string, number> }> {
  return apiFetch<{ current: Record<string, number> }>('/api/v1/ev/fuel-rates', {
    method: 'PUT',
    headers: adminPin ? { 'X-Admin-Pin': adminPin } : {},
    body: JSON.stringify({ ...rates, effective_date }),
  });
}

// Octopus Energy API calls

export async function getOctopusStatus(): Promise<OctopusStatus> {
  return apiFetch<OctopusStatus>('/api/v1/octopus/status');
}

export async function saveOctopusCredentials(
  apiKey: string,
  accountNumber: string,
): Promise<OctopusCredentialResult> {
  return apiFetch<OctopusCredentialResult>('/api/v1/octopus/credentials', {
    method: 'POST',
    body: JSON.stringify({ apiKey, accountNumber }),
  });
}

export async function deleteOctopusCredentials(): Promise<void> {
  await apiFetch<void>('/api/v1/octopus/credentials', { method: 'DELETE' });
}

// TanStack Query hooks for Octopus

export function useOctopusStatus() {
  return useQuery({
    queryKey: ['octopus-status'],
    queryFn: getOctopusStatus,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveOctopusCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiKey, accountNumber }: { apiKey: string; accountNumber: string }) =>
      saveOctopusCredentials(apiKey, accountNumber),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['octopus-status'] });
    },
  });
}

export function useDeleteOctopusCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOctopusCredentials,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['octopus-status'] });
    },
  });
}
