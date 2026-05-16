import apiFetch from '../api/client';
import type { FinanceAgreement, SavingsGoal, FinanceSummary } from './types';

// ─── Agreements ──────────────────────────────────────────────────────────────

export function getAgreements(activeOnly = true): Promise<FinanceAgreement[]> {
  const qs = activeOnly ? '' : '?active=false';
  return apiFetch<FinanceAgreement[]>(`/api/v1/finance/agreements${qs}`);
}

export function createAgreement(input: object): Promise<FinanceAgreement> {
  return apiFetch<FinanceAgreement>('/api/v1/finance/agreements', { method: 'POST', body: input });
}

export function updateAgreement(id: number, patch: object): Promise<FinanceAgreement> {
  return apiFetch<FinanceAgreement>(`/api/v1/finance/agreements/${id}`, {
    method: 'PATCH',
    body: patch,
  });
}

export function deleteAgreement(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/finance/agreements/${id}`, { method: 'DELETE' });
}

// ─── Savings Goals ────────────────────────────────────────────────────────────

export function getSavingsGoals(): Promise<SavingsGoal[]> {
  return apiFetch<SavingsGoal[]>('/api/v1/finance/savings');
}

export function createSavingsGoal(input: object): Promise<SavingsGoal> {
  return apiFetch<SavingsGoal>('/api/v1/finance/savings', { method: 'POST', body: input });
}

export function updateSavingsGoal(id: number, patch: object): Promise<SavingsGoal> {
  return apiFetch<SavingsGoal>(`/api/v1/finance/savings/${id}`, { method: 'PATCH', body: patch });
}

export function deleteSavingsGoal(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/finance/savings/${id}`, { method: 'DELETE' });
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function getFinanceSummary(): Promise<FinanceSummary> {
  return apiFetch<FinanceSummary>('/api/v1/finance/summary');
}
