import { Router } from 'express';
import type { RequestHandler } from 'express';
import FinanceRepository from '../repositories/FinanceRepository';
import SubscriptionRepository from '../repositories/SubscriptionRepository';
import {
  FinanceAgreementInputSchema,
  FinanceAgreementUpdateSchema,
  SavingsGoalInputSchema,
  SavingsGoalUpdateSchema,
  RegularCommitmentInputSchema,
  RegularCommitmentUpdateSchema,
} from '../types/finance';
import type { CommitmentCategory, FinanceSummary } from '../types/finance';

const AGREEMENT_CATEGORY_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  pcp: 'Vehicle Finance (PCP)',
  loan: 'Loans',
  bnpl: 'Buy Now Pay Later',
  insurance: 'Insurance',
};

export default function createFinanceRouter(
  financeRepo: FinanceRepository,
  subRepo: SubscriptionRepository,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();

  // ─── Agreements ──────────────────────────────────────────────────────────────

  router.get('/api/v1/finance/agreements', (req, res, next) => {
    try {
      const activeOnly = req.query.active !== 'false';
      res.json(financeRepo.listAgreements(activeOnly));
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/v1/finance/agreements/:id', (req, res, next) => {
    try {
      const agreement = financeRepo.getAgreement(Number(req.params.id));
      if (!agreement) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(agreement);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/finance/agreements', requireAdminPin, (req, res, next) => {
    try {
      const parsed = FinanceAgreementInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(financeRepo.createAgreement(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/finance/agreements/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const parsed = FinanceAgreementUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const updated = financeRepo.updateAgreement(id, parsed.data);
      if (!updated) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/finance/agreements/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = financeRepo.getAgreement(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      financeRepo.deleteAgreement(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ─── Savings Goals ────────────────────────────────────────────────────────────

  router.get('/api/v1/finance/savings', (_req, res, next) => {
    try {
      res.json(financeRepo.listSavingsGoals());
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/v1/finance/savings/:id', (req, res, next) => {
    try {
      const goal = financeRepo.getSavingsGoal(Number(req.params.id));
      if (!goal) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(goal);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/finance/savings', requireAdminPin, (req, res, next) => {
    try {
      const parsed = SavingsGoalInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(financeRepo.createSavingsGoal(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/finance/savings/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const parsed = SavingsGoalUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const updated = financeRepo.updateSavingsGoal(id, parsed.data);
      if (!updated) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/finance/savings/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = financeRepo.getSavingsGoal(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      financeRepo.deleteSavingsGoal(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ─── Summary ─────────────────────────────────────────────────────────────────

  router.get('/api/v1/finance/summary', (_req, res, next) => {
    try {
      const agreements = financeRepo.listAgreements(true);
      const subscriptions = subRepo.list(true);
      const regulars = financeRepo
        .listRegularCommitments(true)
        .filter((r) => r.direction === 'out');

      // Group agreements by type using reduce
      const agreementMap = agreements.reduce((map, a) => {
        const existing = map.get(a.type);
        if (!existing) {
          map.set(a.type, {
            label: AGREEMENT_CATEGORY_LABELS[a.type] ?? a.type,
            monthly_total_minor: a.monthly_payment_minor,
            items: [
              {
                id: a.id,
                name: a.name,
                monthly_minor: a.monthly_payment_minor,
                source: 'agreement' as const,
              },
            ],
          });
        } else {
          existing.monthly_total_minor += a.monthly_payment_minor;
          existing.items.push({
            id: a.id,
            name: a.name,
            monthly_minor: a.monthly_payment_minor,
            source: 'agreement' as const,
          });
        }
        return map;
      }, new Map<string, CommitmentCategory>());

      // Subscriptions as their own category
      const subItems = subscriptions.map((s): CommitmentCategory['items'][number] => ({
        id: s.id,
        name: s.name,
        monthly_minor: s.monthly_cost,
        source: 'subscription',
      }));
      const subCategory: CommitmentCategory | null =
        subItems.length > 0
          ? {
              label: 'Subscriptions',
              monthly_total_minor: subItems.reduce((sum, i) => sum + i.monthly_minor, 0),
              items: subItems,
            }
          : null;

      // Regular outgoing commitments as their own category
      const regularItems = regulars.map((r): CommitmentCategory['items'][number] => ({
        id: r.id,
        name: r.name,
        monthly_minor: r.amount_minor,
        source: 'agreement' as const,
      }));
      const regularCategory: CommitmentCategory | null =
        regularItems.length > 0
          ? {
              label: 'Regular Commitments',
              monthly_total_minor: regularItems.reduce((sum, i) => sum + i.monthly_minor, 0),
              items: regularItems,
            }
          : null;

      const categories: CommitmentCategory[] = [
        ...Array.from(agreementMap.values()),
        ...(subCategory ? [subCategory] : []),
        ...(regularCategory ? [regularCategory] : []),
      ];

      const grandTotal = categories.reduce((sum, c) => sum + c.monthly_total_minor, 0);

      const summary: FinanceSummary = { categories, grand_total_minor: grandTotal };
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  // ─── Regular Commitments ─────────────────────────────────────────────────────

  router.get('/api/v1/finance/regular', (req, res, next) => {
    try {
      const activeOnly = req.query.active !== 'false';
      res.json(financeRepo.listRegularCommitments(activeOnly));
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/v1/finance/regular/:id', (req, res, next) => {
    try {
      const commitment = financeRepo.getRegularCommitment(Number(req.params.id));
      if (!commitment) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(commitment);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/finance/regular', requireAdminPin, (req, res, next) => {
    try {
      const parsed = RegularCommitmentInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(financeRepo.createRegularCommitment(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/finance/regular/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const parsed = RegularCommitmentUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const updated = financeRepo.updateRegularCommitment(id, parsed.data);
      if (!updated) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/finance/regular/:id', requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = financeRepo.getRegularCommitment(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      financeRepo.deleteRegularCommitment(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ─── Paydown Schedule ─────────────────────────────────────────────────────────

  router.get('/api/v1/finance/agreements/:id/paydown', (req, res, next) => {
    try {
      const schedule = financeRepo.getPaydownSchedule(Number(req.params.id));
      if (!schedule) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
