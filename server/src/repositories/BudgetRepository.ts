import BaseRepository from './BaseRepository';
import type {
  BudgetCategory,
  BudgetCategoryInput,
  BudgetCategoryUpdate,
  BudgetExpense,
  BudgetExpenseInput,
} from '../types/house';

export interface MonthlySummaryEntry {
  category: BudgetCategory;
  spent_minor: number;
  budget_minor: number;
}

export default class BudgetRepository extends BaseRepository {
  // ─── Categories ─────────────────────────────────────────────────────────────

  listCategories(): BudgetCategory[] {
    return this.all<BudgetCategory>('SELECT * FROM budget_categories ORDER BY name');
  }

  getCategory(id: number): BudgetCategory | undefined {
    return this.queryOne<BudgetCategory>('SELECT * FROM budget_categories WHERE id = ?', [id]);
  }

  createCategory(input: BudgetCategoryInput): BudgetCategory {
    const result = this.run(
      'INSERT INTO budget_categories (name, monthly_budget_minor, colour) VALUES (?, ?, ?)',
      [input.name, input.monthly_budget_minor, input.colour ?? null],
    );
    return this.getCategory(result.lastInsertRowid as number)!;
  }

  updateCategory(id: number, patch: BudgetCategoryUpdate): BudgetCategory | undefined {
    const fields = Object.keys(patch) as (keyof BudgetCategoryUpdate)[];
    if (fields.length === 0) return this.getCategory(id);
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => patch[f] ?? null);
    this.run(`UPDATE budget_categories SET ${setClauses} WHERE id = ?`, [...values, id]);
    return this.getCategory(id);
  }

  deleteCategory(id: number): void {
    this.run('DELETE FROM budget_categories WHERE id = ?', [id]);
  }

  // ─── Expenses ────────────────────────────────────────────────────────────────

  listExpenses(categoryId?: number, fromDate?: number, toDate?: number): BudgetExpense[] {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (categoryId !== undefined) {
      conditions.push('category_id = ?');
      params.push(categoryId);
    }
    if (fromDate !== undefined) {
      conditions.push('spent_date >= ?');
      params.push(fromDate);
    }
    if (toDate !== undefined) {
      conditions.push('spent_date <= ?');
      params.push(toDate);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return this.all<BudgetExpense>(
      `SELECT * FROM budget_expenses ${where} ORDER BY spent_date DESC`,
      params,
    );
  }

  getExpense(id: number): BudgetExpense | undefined {
    return this.queryOne<BudgetExpense>('SELECT * FROM budget_expenses WHERE id = ?', [id]);
  }

  createExpense(input: BudgetExpenseInput): BudgetExpense {
    const result = this.run(
      'INSERT INTO budget_expenses (category_id, amount_minor, spent_date, note) VALUES (?, ?, ?, ?)',
      [input.category_id, input.amount_minor, input.spent_date, input.note ?? null],
    );
    return this.getExpense(result.lastInsertRowid as number)!;
  }

  deleteExpense(id: number): void {
    this.run('DELETE FROM budget_expenses WHERE id = ?', [id]);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────

  monthlySummary(year: number, month: number): MonthlySummaryEntry[] {
    const startDate = new Date(year, month - 1, 1).getTime();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    const categories = this.listCategories();

    const spentRows = this.all<{ category_id: number; total: number }>(
      `SELECT category_id, SUM(amount_minor) as total
       FROM budget_expenses
       WHERE spent_date >= ? AND spent_date <= ?
       GROUP BY category_id`,
      [startDate, endDate],
    );

    const spentMap = new Map<number, number>();
    spentRows.forEach((r) => spentMap.set(r.category_id, r.total));

    return categories.map((cat) => ({
      category: cat,
      spent_minor: spentMap.get(cat.id) ?? 0,
      budget_minor: cat.monthly_budget_minor,
    }));
  }
}
