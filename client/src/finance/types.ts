export type AgreementType = 'mortgage' | 'pcp' | 'loan' | 'bnpl' | 'insurance';
export type CommitmentDirection = 'in' | 'out';

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

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount_minor: number;
  current_amount_minor: number;
  currency: string;
  target_date: number | null;
  created_at: number;
}

export interface CommitmentItem {
  id: number;
  name: string;
  monthly_minor: number;
  source: 'agreement' | 'subscription';
}

export interface CommitmentCategory {
  label: string;
  monthly_total_minor: number;
  items: CommitmentItem[];
}

export interface FinanceSummary {
  categories: CommitmentCategory[];
  grand_total_minor: number;
}

export interface RegularCommitment {
  id: number;
  name: string;
  amount_minor: number;
  direction: CommitmentDirection;
  day_of_month: number | null;
  category: string | null;
  currency: string;
  notes: string | null;
  active: boolean;
  created_at: number;
}

export interface PaydownMonth {
  label: string;
  balance_minor: number;
}

export interface PaydownSchedule {
  months: PaydownMonth[];
}
