import BaseRepository from './BaseRepository';
import type {
  FinanceAgreement,
  FinanceAgreementInput,
  FinanceAgreementUpdate,
  SavingsGoal,
  SavingsGoalInput,
  SavingsGoalUpdate,
  RegularCommitment,
  RegularCommitmentInput,
  RegularCommitmentUpdate,
  PaydownSchedule,
} from '../types/finance';

interface RawAgreement extends Omit<FinanceAgreement, 'active'> {
  active: number;
}

interface RawRegularCommitment extends Omit<RegularCommitment, 'active'> {
  active: number;
}

function parseAgreement(raw: RawAgreement): FinanceAgreement {
  return { ...raw, active: raw.active === 1 };
}

function parseRegularCommitment(raw: RawRegularCommitment): RegularCommitment {
  return { ...raw, active: raw.active === 1 };
}

export default class FinanceRepository extends BaseRepository {
  // ─── Agreements ──────────────────────────────────────────────────────────────

  listAgreements(activeOnly = false): FinanceAgreement[] {
    const where = activeOnly ? 'WHERE active = 1' : '';
    return this.all<RawAgreement>(`SELECT * FROM finance_agreements ${where} ORDER BY name`).map(
      parseAgreement,
    );
  }

  getAgreement(id: number): FinanceAgreement | undefined {
    const raw = this.queryOne<RawAgreement>('SELECT * FROM finance_agreements WHERE id = ?', [id]);
    return raw ? parseAgreement(raw) : undefined;
  }

  createAgreement(input: FinanceAgreementInput): FinanceAgreement {
    const result = this.run(
      `INSERT INTO finance_agreements
        (name, type, lender, monthly_payment_minor, start_date, end_date, balance_minor,
         interest_rate, fixed_rate_end_date, balloon_payment_minor, alert_months_before,
         currency, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.type,
        input.lender ?? null,
        input.monthly_payment_minor,
        input.start_date,
        input.end_date ?? null,
        input.balance_minor ?? null,
        input.interest_rate ?? null,
        input.fixed_rate_end_date ?? null,
        input.balloon_payment_minor ?? null,
        input.alert_months_before,
        input.currency,
        input.notes ?? null,
      ],
    );
    return this.getAgreement(result.lastInsertRowid as number)!;
  }

  updateAgreement(id: number, patch: FinanceAgreementUpdate): FinanceAgreement | undefined {
    const fields = Object.keys(patch) as (keyof FinanceAgreementUpdate)[];
    if (fields.length === 0) return this.getAgreement(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE finance_agreements SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.getAgreement(id);
  }

  deleteAgreement(id: number): void {
    this.run('DELETE FROM finance_agreements WHERE id = ?', [id]);
  }

  /** Returns monthly_payment_minor sum for active agreements, grouped by type. */
  monthlyByType(): { type: string; total: number }[] {
    return this.all<{ type: string; total: number }>(
      `SELECT type, SUM(monthly_payment_minor) as total
       FROM finance_agreements
       WHERE active = 1
       GROUP BY type`,
    );
  }

  // ─── Savings Goals ────────────────────────────────────────────────────────────

  listSavingsGoals(): SavingsGoal[] {
    return this.all<SavingsGoal>('SELECT * FROM savings_goals ORDER BY created_at DESC');
  }

  getSavingsGoal(id: number): SavingsGoal | undefined {
    return this.queryOne<SavingsGoal>('SELECT * FROM savings_goals WHERE id = ?', [id]);
  }

  createSavingsGoal(input: SavingsGoalInput): SavingsGoal {
    const result = this.run(
      `INSERT INTO savings_goals (name, target_amount_minor, current_amount_minor, currency, target_date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.name,
        input.target_amount_minor,
        input.current_amount_minor,
        input.currency,
        input.target_date ?? null,
      ],
    );
    return this.getSavingsGoal(result.lastInsertRowid as number)!;
  }

  updateSavingsGoal(id: number, patch: SavingsGoalUpdate): SavingsGoal | undefined {
    const fields = Object.keys(patch) as (keyof SavingsGoalUpdate)[];
    if (fields.length === 0) return this.getSavingsGoal(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => patch[f] ?? null);
    this.run(`UPDATE savings_goals SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.getSavingsGoal(id);
  }

  deleteSavingsGoal(id: number): void {
    this.run('DELETE FROM savings_goals WHERE id = ?', [id]);
  }

  // ─── Regular Commitments ─────────────────────────────────────────────────────

  listRegularCommitments(activeOnly = false): RegularCommitment[] {
    const where = activeOnly ? 'WHERE active = 1' : '';
    return this.all<RawRegularCommitment>(
      `SELECT * FROM regular_commitments ${where} ORDER BY direction DESC, name`,
    ).map(parseRegularCommitment);
  }

  getRegularCommitment(id: number): RegularCommitment | undefined {
    const raw = this.queryOne<RawRegularCommitment>(
      'SELECT * FROM regular_commitments WHERE id = ?',
      [id],
    );
    return raw ? parseRegularCommitment(raw) : undefined;
  }

  createRegularCommitment(input: RegularCommitmentInput): RegularCommitment {
    const result = this.run(
      `INSERT INTO regular_commitments
        (name, amount_minor, direction, day_of_month, category, currency, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.amount_minor,
        input.direction,
        input.day_of_month ?? null,
        input.category ?? null,
        input.currency,
        input.notes ?? null,
      ],
    );
    return this.getRegularCommitment(result.lastInsertRowid as number)!;
  }

  updateRegularCommitment(
    id: number,
    patch: RegularCommitmentUpdate,
  ): RegularCommitment | undefined {
    const fields = Object.keys(patch) as (keyof RegularCommitmentUpdate)[];
    if (fields.length === 0) return this.getRegularCommitment(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => {
      const v = patch[f];
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v ?? null;
    });
    this.run(`UPDATE regular_commitments SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.getRegularCommitment(id);
  }

  deleteRegularCommitment(id: number): void {
    this.run('DELETE FROM regular_commitments WHERE id = ?', [id]);
  }

  /** Sum of active outgoing regular commitments per month. */
  regularOutgoingMonthly(): number {
    const row = this.queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount_minor), 0) as total
       FROM regular_commitments
       WHERE active = 1 AND direction = 'out'`,
    );
    return row?.total ?? 0;
  }

  // ─── Paydown Schedule ─────────────────────────────────────────────────────────

  getPaydownSchedule(id: number, now: Date = new Date()): PaydownSchedule | undefined {
    const agreement = this.getAgreement(id);
    if (!agreement) return undefined;
    if (!agreement.balance_minor || !agreement.monthly_payment_minor) {
      return { months: [] };
    }

    const monthlyRate = agreement.interest_rate != null ? agreement.interest_rate / 100 / 12 : 0;
    const maxMonths = 360;

    let balance = agreement.balance_minor;
    const months: PaydownSchedule['months'] = [];
    const cursor = new Date(now);

    for (let i = 0; i < maxMonths && balance > 0; i += 1) {
      const interest = Math.round(balance * monthlyRate);
      const principal = Math.min(agreement.monthly_payment_minor - interest, balance);
      balance = Math.max(balance - principal, 0);

      const label = cursor.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      months.push({ label, balance_minor: balance });

      cursor.setMonth(cursor.getMonth() + 1);

      if (agreement.end_date && cursor.getTime() > agreement.end_date) break;
    }

    return { months };
  }
}
