import { Router } from 'express';
import ChecklistRepository from '../repositories/ChecklistRepository';
import {
  ChecklistInputSchema,
  ChecklistUpdateSchema,
  ChecklistItemInputSchema,
  ChecklistItemUpdateSchema,
} from '../types/house';

export default function createChecklistsRouter(checklistRepo: ChecklistRepository): Router {
  const router = Router();

  router.get('/api/v1/checklists', (_req, res, next) => {
    try {
      res.json(checklistRepo.list());
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/checklists', (req, res, next) => {
    try {
      const parsed = ChecklistInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(checklistRepo.create(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/v1/checklists/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const item = checklistRepo.get(id);
      if (!item) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/checklists/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const parsed = ChecklistUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const checklist = checklistRepo.update(id, parsed.data);
      if (!checklist) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(checklist);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/checklists/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = checklistRepo.get(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      checklistRepo.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/checklists/:id/items', (req, res, next) => {
    try {
      const checklistId = Number(req.params.id);
      const checklist = checklistRepo.get(checklistId);
      if (!checklist) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      const parsed = ChecklistItemInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(checklistRepo.createItem(checklistId, parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/checklists/:id/items/:itemId', (req, res, next) => {
    try {
      const itemId = Number(req.params.itemId);
      const parsed = ChecklistItemUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const item = checklistRepo.updateItem(itemId, parsed.data);
      if (!item) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/checklists/:id/items/:itemId', (req, res, next) => {
    try {
      const itemId = Number(req.params.itemId);
      checklistRepo.deleteItem(itemId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/checklists/:id/reset', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = checklistRepo.get(id);
      if (!existing) {
        res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
        return;
      }
      checklistRepo.resetItems(id);
      res.json(checklistRepo.get(id));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
