import { z } from 'zod';

// ─── Finance Agreements ───────────────────────────────────────────────────────

export const AGREEMENT_TYPES = ['mortgage', 'pcp', 'loan', 'bnpl', 'insurance'] as const;
export type AgreementType = (typeof AGREEMENT_TYPES)[number];

export interface FinanceAgreement {
  id: number;
  name: string;
  type: AgreementType;
  lender: string | null;
  monthly_payment_minor: number;
  start_date: number;
  end_date: number | null;
  balance_minor: number | null;
  interest_rate: number | null;
  fixed_rate_end_date: number | null;
  balloon_payment_minor: number | null;
  alert_months_before: number;
  currency: string;
  notes: string | null;
  active: boolean;
}

export const FinanceAgreementInputSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(AGREEMENT_TYPES),
  lender: z.string().max(200).nullable().optional(),
  monthly_payment_minor: z.number().int().min(0),
  start_date: z.number().int(),
  end_date: z.number().int().nullable().optional(),
  balance_minor: z.number().int().min(0).nullable().optional(),
  interest_rate: z.number().min(0).max(100).nullable().optional(),
  fixed_rate_end_date: z.number().int().nullable().optional(),
  balloon_payment_minor: z.number().int().min(0).nullable().optional(),
  alert_months_before: z.number().int().min(1).default(3),
  currency: z.string().length(3).default('GBP'),
  notes: z.string().max(2000).nullable().optional(),
});
export type FinanceAgreementInput = z.infer<typeof FinanceAgreementInputSchema>;

export const FinanceAgreementUpdateSchema = FinanceAgreementInputSchema.partial().extend({
  active: z.boolean().optional(),
});
export type FinanceAgreementUpdate = z.infer<typeof FinanceAgreementUpdateSchema>;

// ─── Savings Goals ────────────────────────────────────────────────────────────

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount_minor: number;
  current_amount_minor: number;
  currency: string;
  target_date: number | null;
  created_at: number;
}

export const SavingsGoalInputSchema = z.object({
  name: z.string().min(1).max(200),
  target_amount_minor: z.number().int().min(1),
  current_amount_minor: z.number().int().min(0).default(0),
  currency: z.string().length(3).default('GBP'),
  target_date: z.number().int().nullable().optional(),
});
export type SavingsGoalInput = z.infer<typeof SavingsGoalInputSchema>;

export const SavingsGoalUpdateSchema = SavingsGoalInputSchema.partial();
export type SavingsGoalUpdate = z.infer<typeof SavingsGoalUpdateSchema>;

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface CommitmentCategory {
  label: string;
  monthly_total_minor: number;
  items: CommitmentItem[];
}

export interface CommitmentItem {
  id: number;
  name: string;
  monthly_minor: number;
  source: 'agreement' | 'subscription';
}

export interface FinanceSummary {
  categories: CommitmentCategory[];
  grand_total_minor: number;
}
