CREATE TABLE finance_agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('mortgage','pcp','loan','bnpl','insurance')),
  lender TEXT,
  monthly_payment_minor INTEGER NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER,
  balance_minor INTEGER,
  interest_rate REAL,
  fixed_rate_end_date INTEGER,
  balloon_payment_minor INTEGER,
  alert_months_before INTEGER NOT NULL DEFAULT 3,
  currency TEXT NOT NULL DEFAULT 'GBP',
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_finance_agreements_end ON finance_agreements(end_date);
CREATE INDEX idx_finance_agreements_fixed_rate ON finance_agreements(fixed_rate_end_date);

CREATE TABLE savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target_amount_minor INTEGER NOT NULL,
  current_amount_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  target_date INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
