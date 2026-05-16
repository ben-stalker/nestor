import apiFetch from '../api/client';
import type {
  BinSchedule,
  BinUpcomingResponse,
  Subscription,
  SubscriptionsResponse,
  HomeMaintenance,
  MaintenanceType,
  MeterReading,
  FuelType,
  BudgetCategory,
  BudgetExpense,
  MonthlySummaryEntry,
  Checklist,
  ChecklistWithItems,
  ChecklistItem,
} from './types';

// ─── Bin Schedules ────────────────────────────────────────────────────────────

export function getBinSchedules(): Promise<BinSchedule[]> {
  return apiFetch<BinSchedule[]>('/api/v1/bin-schedules');
}

export function getBinUpcoming(days = 14): Promise<BinUpcomingResponse> {
  return apiFetch<BinUpcomingResponse>(`/api/v1/bin-schedules/upcoming?days=${days}`);
}

export function createBinSchedule(input: object): Promise<BinSchedule> {
  return apiFetch<BinSchedule>('/api/v1/bin-schedules', { method: 'POST', body: input });
}

export function updateBinSchedule(id: number, patch: object): Promise<BinSchedule> {
  return apiFetch<BinSchedule>(`/api/v1/bin-schedules/${id}`, { method: 'PATCH', body: patch });
}

export function deleteBinSchedule(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/bin-schedules/${id}`, { method: 'DELETE' });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function getSubscriptions(): Promise<SubscriptionsResponse> {
  return apiFetch<SubscriptionsResponse>('/api/v1/subscriptions');
}

export function createSubscription(input: object): Promise<Subscription> {
  return apiFetch<Subscription>('/api/v1/subscriptions', { method: 'POST', body: input });
}

export function updateSubscription(id: number, patch: object): Promise<Subscription> {
  return apiFetch<Subscription>(`/api/v1/subscriptions/${id}`, { method: 'PATCH', body: patch });
}

export function deleteSubscription(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/subscriptions/${id}`, { method: 'DELETE' });
}

// ─── Home Maintenance ─────────────────────────────────────────────────────────

export function getMaintenanceItems(type?: MaintenanceType): Promise<HomeMaintenance[]> {
  const qs = type ? `?type=${type}` : '';
  return apiFetch<HomeMaintenance[]>(`/api/v1/maintenance${qs}`);
}

export function createMaintenanceItem(input: object): Promise<HomeMaintenance> {
  return apiFetch<HomeMaintenance>('/api/v1/maintenance', { method: 'POST', body: input });
}

export function updateMaintenanceItem(id: number, patch: object): Promise<HomeMaintenance> {
  return apiFetch<HomeMaintenance>(`/api/v1/maintenance/${id}`, { method: 'PATCH', body: patch });
}

export function deleteMaintenanceItem(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/maintenance/${id}`, { method: 'DELETE' });
}

// ─── Meter Readings ───────────────────────────────────────────────────────────

export function getMeterReadings(fuelType: FuelType): Promise<MeterReading[]> {
  return apiFetch<MeterReading[]>(`/api/v1/meter-readings?fuelType=${fuelType}`);
}

export function createMeterReading(input: object): Promise<MeterReading> {
  return apiFetch<MeterReading>('/api/v1/meter-readings', { method: 'POST', body: input });
}

export function deleteMeterReading(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/meter-readings/${id}`, { method: 'DELETE' });
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export function getBudgetCategories(): Promise<BudgetCategory[]> {
  return apiFetch<BudgetCategory[]>('/api/v1/budget/categories');
}

export function createBudgetCategory(input: object): Promise<BudgetCategory> {
  return apiFetch<BudgetCategory>('/api/v1/budget/categories', { method: 'POST', body: input });
}

export function updateBudgetCategory(id: number, patch: object): Promise<BudgetCategory> {
  return apiFetch<BudgetCategory>(`/api/v1/budget/categories/${id}`, {
    method: 'PATCH',
    body: patch,
  });
}

export function deleteBudgetCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/budget/categories/${id}`, { method: 'DELETE' });
}

export function getBudgetExpenses(
  categoryId?: number,
  year?: number,
  month?: number,
): Promise<BudgetExpense[]> {
  const params = new URLSearchParams();
  if (categoryId !== undefined) params.set('categoryId', String(categoryId));
  if (year !== undefined) params.set('year', String(year));
  if (month !== undefined) params.set('month', String(month));
  const qs = params.toString();
  return apiFetch<BudgetExpense[]>(`/api/v1/budget/expenses${qs ? `?${qs}` : ''}`);
}

export function createBudgetExpense(input: object): Promise<BudgetExpense> {
  return apiFetch<BudgetExpense>('/api/v1/budget/expenses', { method: 'POST', body: input });
}

export function deleteBudgetExpense(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/budget/expenses/${id}`, { method: 'DELETE' });
}

export function getBudgetSummary(year: number, month: number): Promise<MonthlySummaryEntry[]> {
  return apiFetch<MonthlySummaryEntry[]>(`/api/v1/budget/summary?year=${year}&month=${month}`);
}

// ─── Checklists ───────────────────────────────────────────────────────────────

export function getChecklists(): Promise<Checklist[]> {
  return apiFetch<Checklist[]>('/api/v1/checklists');
}

export function getChecklist(id: number): Promise<ChecklistWithItems> {
  return apiFetch<ChecklistWithItems>(`/api/v1/checklists/${id}`);
}

export function createChecklist(input: object): Promise<Checklist> {
  return apiFetch<Checklist>('/api/v1/checklists', { method: 'POST', body: input });
}

export function updateChecklist(id: number, patch: object): Promise<Checklist> {
  return apiFetch<Checklist>(`/api/v1/checklists/${id}`, { method: 'PATCH', body: patch });
}

export function deleteChecklist(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/checklists/${id}`, { method: 'DELETE' });
}

export function addChecklistItem(checklistId: number, input: object): Promise<ChecklistItem> {
  return apiFetch<ChecklistItem>(`/api/v1/checklists/${checklistId}/items`, {
    method: 'POST',
    body: input,
  });
}

export function updateChecklistItem(
  checklistId: number,
  itemId: number,
  patch: object,
): Promise<ChecklistItem> {
  return apiFetch<ChecklistItem>(`/api/v1/checklists/${checklistId}/items/${itemId}`, {
    method: 'PATCH',
    body: patch,
  });
}

export function deleteChecklistItem(checklistId: number, itemId: number): Promise<void> {
  return apiFetch<void>(`/api/v1/checklists/${checklistId}/items/${itemId}`, { method: 'DELETE' });
}

export function resetChecklist(id: number): Promise<ChecklistWithItems> {
  return apiFetch<ChecklistWithItems>(`/api/v1/checklists/${id}/reset`, { method: 'POST' });
}

// ─── Chores (adult filter) ────────────────────────────────────────────────────

export function getAdultChores(): Promise<import('../family/types').Chore[]> {
  return apiFetch<import('../family/types').Chore[]>('/api/v1/chores?profileType=adult');
}
