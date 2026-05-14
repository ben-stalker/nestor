import { Router } from 'express';
import MealPlanRepository from '../repositories/MealPlanRepository';
import RecipeRepository from '../repositories/RecipeRepository';
import type ProfileRepository from '../repositories/ProfileRepository';
import createRequireProfile from '../middleware/requireProfile';
import requirePermission from '../middleware/requirePermission';
import { MealPlanEntryInputSchema } from '../types/food';

export default function createMealPlanRouter(
  mealPlanRepo: MealPlanRepository,
  _recipeRepo: RecipeRepository,
  profileRepo: ProfileRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  // GET /api/v1/meal-plan?start=YYYY-MM-DD&end=YYYY-MM-DD
  router.get(
    '/api/v1/meal-plan',
    requireProfile,
    requirePermission('view_food'),
    (req, res, next) => {
      try {
        const start = typeof req.query.start === 'string' ? req.query.start : undefined;
        const end = typeof req.query.end === 'string' ? req.query.end : undefined;

        if (
          !start ||
          !end ||
          !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(end)
        ) {
          res.status(400).json({
            error: 'validation',
            code: 'INVALID_INPUT',
            details: ['start and end query params required in YYYY-MM-DD format'],
          });
          return;
        }

        const entries = mealPlanRepo.listForRange(start, end);
        res.json(entries);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/v1/meal-plan — upsert entry
  router.post(
    '/api/v1/meal-plan',
    requireProfile,
    requirePermission('view_food'),
    (req, res, next) => {
      try {
        const parsed = MealPlanEntryInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: 'validation',
            code: 'INVALID_INPUT',
            details: parsed.error.issues,
          });
          return;
        }

        const entry = mealPlanRepo.upsert(parsed.data);
        res.status(201).json(entry);
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/v1/meal-plan/:id
  router.delete(
    '/api/v1/meal-plan/:id',
    requireProfile,
    requirePermission('view_food'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res.status(400).json({
            error: 'validation',
            code: 'INVALID_INPUT',
            details: ['invalid id'],
          });
          return;
        }

        const existing = mealPlanRepo.get(id);
        if (!existing) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }

        mealPlanRepo.delete(id);
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
