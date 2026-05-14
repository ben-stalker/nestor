import fs from 'fs';
import os from 'os';
import path from 'path';
import { Router } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';
import type { RequestHandler } from 'express';
import RecipeRepository from '../repositories/RecipeRepository';
import AppSettingsRepository from '../repositories/AppSettingsRepository';
import createRequireProfile from '../middleware/requireProfile';
import requirePermission from '../middleware/requirePermission';
import type ProfileRepository from '../repositories/ProfileRepository';
import { RecipeInputSchema, RecipeUpdateSchema } from '../types/food';
import { scrapeRecipe } from '../services/recipeScraper';
import logger from '../utils/logger';

const UPLOAD_DIR = path.join(os.homedir(), '.nestor', 'uploads', 'recipes');

function ensureUploadDir(): void {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export default function createRecipesRouter(
  recipeRepo: RecipeRepository,
  settingsRepo: AppSettingsRepository,
  profileRepo: ProfileRepository,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  // GET /api/v1/recipes — list recipes (no ingredients for performance)
  router.get(
    '/api/v1/recipes',
    requireProfile,
    requirePermission('view_food'),
    (req, res, next) => {
      try {
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const tagsRaw = typeof req.query.tags === 'string' ? req.query.tags : undefined;
        const tags = tagsRaw
          ? tagsRaw
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined;

        const recipes = recipeRepo.list({ search, tags });
        res.json(recipes);
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/v1/recipes/:id — single recipe with ingredients
  router.get(
    '/api/v1/recipes/:id',
    requireProfile,
    requirePermission('view_food'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        const recipe = recipeRepo.get(id);
        if (!recipe) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        res.json(recipe);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/v1/recipes/import-url — scrape recipe from URL
  // Must be registered before /:id to avoid route conflict
  router.post(
    '/api/v1/recipes/import-url',
    requireProfile,
    requirePermission('add_recipe'),
    (req, res) => {
      const { url } = req.body as { url?: string };
      if (!url || typeof url !== 'string') {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: ['url required'] });
        return;
      }

      // Log warning once if url_import_warned not yet set
      const warned = settingsRepo.get<boolean>('url_import_warned');
      if (!warned) {
        logger.warn(
          { url },
          'Recipe URL import used for first time — ensure you have rights to scrape the source',
        );
        settingsRepo.set('url_import_warned', true);
      }

      scrapeRecipe(url)
        .then((result) => {
          res.json(result);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Unknown error';
          res.status(422).json({ error: 'scrape_failed', message });
        });
    },
  );

  // POST /api/v1/recipes — create recipe
  router.post(
    '/api/v1/recipes',
    requireProfile,
    requirePermission('add_recipe'),
    (req, res, next) => {
      try {
        const parsed = RecipeInputSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const recipe = recipeRepo.create(parsed.data);
        res.status(201).json(recipe);
      } catch (err) {
        next(err);
      }
    },
  );

  // PATCH /api/v1/recipes/:id — update recipe
  router.patch(
    '/api/v1/recipes/:id',
    requireProfile,
    requirePermission('add_recipe'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        const existing = recipeRepo.get(id);
        if (!existing) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        const parsed = RecipeUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
          return;
        }
        const updated = recipeRepo.update(id, parsed.data);
        res.json(updated);
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/v1/recipes/:id — delete recipe (admin PIN required)
  router.delete('/api/v1/recipes/:id', requireProfile, requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const existing = recipeRepo.get(id);
      if (!existing) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      recipeRepo.delete(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/recipes/:id/photo — stream photo file
  router.get(
    '/api/v1/recipes/:id/photo',
    requireProfile,
    requirePermission('view_food'),
    (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }
        const recipe = recipeRepo.get(id);
        if (!recipe) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }
        if (!recipe.photo_path || !fs.existsSync(recipe.photo_path)) {
          res.status(404).json({ error: 'NO_PHOTO' });
          return;
        }
        res.sendFile(recipe.photo_path, (err: unknown) => {
          if (err) next(err);
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/v1/recipes/:id/photo — upload and resize photo
  router.post(
    '/api/v1/recipes/:id/photo',
    requireProfile,
    requirePermission('add_recipe'),
    (req, res, next) => {
      // Run multer middleware and catch file-size errors before the main handler
      upload.single('photo')(req, res, (err: unknown) => {
        if (err) {
          // multer.MulterError with code LIMIT_FILE_SIZE → 400
          if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              error: 'validation',
              code: 'FILE_TOO_LARGE',
              details: ['Photo must be ≤ 10 MB'],
            });
            return;
          }
          next(err);
          return;
        }

        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
          return;
        }

        const existing = recipeRepo.get(id);
        if (!existing) {
          res.status(404).json({ error: 'NOT_FOUND' });
          return;
        }

        if (!req.file) {
          res
            .status(400)
            .json({ error: 'validation', code: 'INVALID_INPUT', details: ['photo file required'] });
          return;
        }

        ensureUploadDir();
        const filename = `${crypto.randomUUID()}.webp`;
        const filePath = path.join(UPLOAD_DIR, filename);
        const photoPath = filePath;

        sharp(req.file.buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp()
          .toFile(filePath)
          .then(() => {
            const updated = recipeRepo.update(id, { photo_path: photoPath });
            res.json({ photo_path: updated?.photo_path ?? photoPath });
          })
          .catch((fileErr: unknown) => next(fileErr));
      });
    },
  );

  return router;
}
