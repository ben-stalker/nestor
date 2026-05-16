import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import BudgetRepository from '../repositories/BudgetRepository';
import {
  BudgetCategoryInputSchema,
  BudgetCategoryUpdateSchema,
  BudgetExpenseInputSchema,
} from '../types/house';

export default function createBudgetRouter(
  budgetRepo: BudgetRepository,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();

  // ─── Categories ─────────────────────────────────────────────────────────────

  router.get('/api/v1/budget/categories', (_req, res, next) => {
    try {
      res.json(budgetRepo.listCategories());
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/budget/categories', requireAdminPin, (req, res, next) => {
    try {
      const parsed = BudgetCategoryInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(budgetRepo.createCategory(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/budget/categories/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const parsed = BudgetCategoryUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const cat = budgetRepo.updateCategory(id, parsed.data);
      if (!cat) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(cat);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/budget/categories/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = budgetRepo.getCategory(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      budgetRepo.deleteCategory(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ─── Expenses ────────────────────────────────────────────────────────────────

  router.get('/api/v1/budget/expenses', (req, res, next) => {
    try {
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const month = req.query.month ? Number(req.query.month) : undefined;

      let fromDate: number | undefined;
      let toDate: number | undefined;
      if (year && month) {
        fromDate = new Date(year, month - 1, 1).getTime();
        toDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      }

      res.json(budgetRepo.listExpenses(categoryId, fromDate, toDate));
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/budget/expenses', (req, res, next) => {
    try {
      const parsed = BudgetExpenseInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(budgetRepo.createExpense(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/budget/expenses/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = budgetRepo.getExpense(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      budgetRepo.deleteExpense(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ─── Summary ─────────────────────────────────────────────────────────────────

  router.get('/api/v1/budget/summary', (req, res, next) => {
    try {
      const YearMonthSchema = z.object({
        year: z.coerce.number().int().min(2000).max(2100),
        month: z.coerce.number().int().min(1).max(12),
      });
      const now = new Date();
      const parsed = YearMonthSchema.safeParse({
        year: req.query.year ?? now.getFullYear(),
        month: req.query.month ?? now.getMonth() + 1,
      });
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.json(budgetRepo.monthlySummary(parsed.data.year, parsed.data.month));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
