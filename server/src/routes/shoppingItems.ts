import { Router } from 'express';
import ShoppingItemRepository from '../repositories/ShoppingItemRepository';
import RecipeRepository from '../repositories/RecipeRepository';
import type ProfileRepository from '../repositories/ProfileRepository';
import createRequireProfile from '../middleware/requireProfile';
import requirePermission from '../middleware/requirePermission';
import { ShoppingItemInputSchema, ShoppingItemUpdateSchema } from '../types/food';
import { ShoppingItemService } from '../services/ShoppingItemService';
import eventBus from '../core/eventBus';

export default function createShoppingItemsRouter(
  shoppingRepo: ShoppingItemRepository,
  recipeRepo: RecipeRepository,
  profileRepo: ProfileRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);
  const shoppingService = new ShoppingItemService(shoppingRepo, recipeRepo);

  // GET /api/v1/shopping — list all items
  router.get(
    '/api/v1/shopping',
    requireProfile,
    requirePermission('view_food'),
    (_req, res, next) => {
      try {
        const items = shoppingRepo.list();
        res.json(items);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/v1/shopping — create a single item manually
  router.post(
    '/api/v1/shopping',
    requireProfile,
    requirePermission('add_to_shopping'),
    (req, res, next) => {
      try {
        const profile = req.profile!;
        const pendingApproval = profile.type === 'teen' ? 1 : 0;

        const body: Record<string, unknown> = {
          ...(req.body as Record<string, unknown>),
          added_by_profile_id: profile.id,
          pending_approval:
            (req.body as Record<string, unknown>).pending_approval ?? pendingApproval,
        };

        const parsed = ShoppingItemInputSchema.safeParse(body);
        if (!parsed.success) {
          res.status(400).json({
            error: 'validation',
            code: 'INVALID_INPUT',
            details: parsed.error.issues,
          });
          return;
        }

        const item = shoppingRepo.create(parsed.data);
        eventBus.emit('shopping:updated', {});
        res.status(201).json(item);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/v1/shopping/from-recipe — add ingredients from a recipe
  router.post(
    '/api/v1/shopping/from-recipe',
    requireProfile,
    requirePermission('add_to_shopping'),
    (req, res, next) => {
      const profile = req.profile!;
      const body = req.body as {
        recipe_id?: unknown;
        ingredient_ids?: unknown;
        scale?: unknown;
      };

      const recipeId = Number(body.recipe_id);
      if (!Number.isInteger(recipeId) || recipeId <= 0) {
        res.status(400).json({
          error: 'validation',
          code: 'INVALID_INPUT',
          details: ['recipe_id must be a positive integer'],
        });
        return;
      }

      const ingredientIds: number[] = Array.isArray(body.ingredient_ids)
        ? (body.ingredient_ids as unknown[]).map(Number).filter((n) => Number.isInteger(n) && n > 0)
        : [];

      const scaleFactor = body.scale != null ? Number(body.scale) : 1;
      if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
        res.status(400).json({
          error: 'validation',
          code: 'INVALID_INPUT',
          details: ['scale must be a positive number'],
        });
        return;
      }

      shoppingService
        .addFromRecipe(recipeId, ingredientIds, scaleFactor, profile.id, profile.type)
        .then((result) => {
          res.status(201).json(result);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Unknown error';
          // Recipe not found → 404
          if (message.includes('not found')) {
            res.status(404).json({ error: 'NOT_FOUND' });
            return;
          }
          next(err);
        });
    },
  );

  // PATCH /api/v1/shopping/:id — update item (tick, name, quantity, etc.)
  router.patch(
    '/api/v1/shopping/:id',
    requireProfile,
    requirePermission('tick_shopping'),
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

        const existing = shoppingRepo.get(id);
        if (!existing) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }

        const parsed = ShoppingItemUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({
            error: 'validation',
            code: 'INVALID_INPUT',
            details: parsed.error.issues,
          });
          return;
        }

        const updated = shoppingRepo.update(id, parsed.data);
        eventBus.emit('shopping:updated', {});
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/v1/shopping/:id — remove a single item
  router.delete(
    '/api/v1/shopping/:id',
    requireProfile,
    requirePermission('add_to_shopping'),
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

        const existing = shoppingRepo.get(id);
        if (!existing) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }

        shoppingRepo.delete(id);
        eventBus.emit('shopping:updated', {});
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/v1/shopping — clear all ticked items
  router.delete(
    '/api/v1/shopping',
    requireProfile,
    requirePermission('tick_shopping'),
    (_req, res, next) => {
      try {
        const count = shoppingRepo.clearTicked();
        eventBus.emit('shopping:updated', {});
        res.json({ deleted: count });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
