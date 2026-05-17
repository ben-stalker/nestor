import apiFetch from '../api/client';
import type {
  EvChargingLog,
  MonthlyEvSummary,
  EnergySummary,
  FuelRates,
  EvChargingLogInput,
  EvChargingLogUpdate,
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
