import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import type { RequestHandler } from 'express';
import createRequireProfile from '../middleware/requireProfile';
import type ProfileRepository from '../repositories/ProfileRepository';
import type BoardMessageRepository from '../repositories/BoardMessageRepository';
import type CountdownRepository from '../repositories/CountdownRepository';
import type WhiteboardRepository from '../repositories/WhiteboardRepository';
import type ChecklistRepository from '../repositories/ChecklistRepository';
import {
  BoardMessageInputSchema,
  BoardMessageUpdateSchema,
  CountdownTimerInputSchema,
  CountdownTimerUpdateSchema,
  WhiteboardSnapshotInputSchema,
} from '../types/board';
import { ChecklistInputSchema, ChecklistItemInputSchema, ChecklistItemUpdateSchema, ChecklistUpdateSchema } from '../types/house';
import eventBus from '../core/eventBus';

const WHITEBOARD_DIR = path.join(os.homedir(), '.nestor', 'uploads', 'whiteboard');

function ensureWhiteboardDir(): void {
  fs.mkdirSync(WHITEBOARD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/png') cb(null, true);
    else cb(new Error('Only PNG images are allowed'));
  },
});

export default function createBoardRouter(
  boardMsgRepo: BoardMessageRepository,
  countdownRepo: CountdownRepository,
  whiteboardRepo: WhiteboardRepository,
  checklistRepo: ChecklistRepository,
  requireAdminPin: RequestHandler,
  profileRepo: ProfileRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  // ─── Board Messages ───────────────────────────────────────────────────────────

  router.get('/api/v1/board/messages', requireProfile, (req, res, next) => {
    try {
      const includeArchived = req.query.archived === 'true';
      const messages = includeArchived ? boardMsgRepo.list() : boardMsgRepo.listActive();
      res.json(messages);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/board/messages', requireProfile, (req, res, next) => {
    try {
      const parsed = BoardMessageInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const profileId = req.profile?.id ?? null;
      const message = boardMsgRepo.create(profileId, parsed.data);
      eventBus.emit('board:message_new', { id: message.id });
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/board/messages/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!boardMsgRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const parsed = BoardMessageUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.json(boardMsgRepo.update(id, parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/board/messages/:id/archive', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!boardMsgRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(boardMsgRepo.archive(id));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/board/messages/:id', requireProfile, requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!boardMsgRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      boardMsgRepo.delete(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // ─── Countdown Timers ─────────────────────────────────────────────────────────

  router.get('/api/v1/board/countdowns', requireProfile, (_req, res, next) => {
    try {
      res.json(countdownRepo.list());
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/board/countdowns', requireProfile, (req, res, next) => {
    try {
      const parsed = CountdownTimerInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(countdownRepo.create(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/board/countdowns/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!countdownRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const parsed = CountdownTimerUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.json(countdownRepo.update(id, parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/board/countdowns/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!countdownRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      countdownRepo.delete(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // ─── Whiteboard Snapshots ─────────────────────────────────────────────────────

  router.get('/api/v1/board/whiteboard', requireProfile, (_req, res, next) => {
    try {
      res.json(whiteboardRepo.list());
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/board/whiteboard', requireProfile, (req, res, next) => {
    upload.single('snapshot')(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'validation', code: 'FILE_TOO_LARGE', details: ['Snapshot must be ≤ 20 MB'] });
          return;
        }
        if (err instanceof Error) {
          res.status(400).json({ error: 'validation', code: 'INVALID_FILE_TYPE', details: [err.message] });
          return;
        }
        next(err);
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['snapshot file required'] });
        return;
      }

      const rawName = typeof req.body === 'object' && req.body !== null && 'name' in (req.body as object)
        ? (req.body as Record<string, unknown>).name
        : undefined;
      const nameResult = WhiteboardSnapshotInputSchema.safeParse({
        name: (typeof rawName === 'string' ? rawName : null) ?? `Whiteboard ${new Date().toLocaleString()}`,
      });
      if (!nameResult.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: nameResult.error.issues });
        return;
      }

      try {
        ensureWhiteboardDir();
        const filename = `${crypto.randomUUID()}.png`;
        const filePath = path.join(WHITEBOARD_DIR, filename);
        fs.writeFileSync(filePath, req.file.buffer);

        const snapshot = whiteboardRepo.create({
          name: nameResult.data.name,
          file_path: filePath,
        });
        res.status(201).json(snapshot);
      } catch (writeErr) {
        next(writeErr);
      }
    });
  });

  router.get('/api/v1/board/whiteboard/:id/image', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const snapshot = whiteboardRepo.get(id);
      if (!snapshot) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      if (!fs.existsSync(snapshot.file_path)) {
        res.status(404).json({ error: 'FILE_NOT_FOUND' });
        return;
      }
      res.sendFile(snapshot.file_path, (err: unknown) => {
        if (err) next(err);
      });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/board/whiteboard/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!whiteboardRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const parsed = WhiteboardSnapshotInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.json(whiteboardRepo.updateName(id, parsed.data.name));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/board/whiteboard/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const snapshot = whiteboardRepo.get(id);
      if (!snapshot) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      whiteboardRepo.delete(id);
      try { fs.unlinkSync(snapshot.file_path); } catch { /* ignore missing file */ }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // ─── Board Lists (reuses checklist engine, type=one_off|recurring) ─────────────

  router.get('/api/v1/board/lists', requireProfile, (_req, res, next) => {
    try {
      const lists = checklistRepo.list().filter(
        (c) => c.type === 'one_off' || c.type === 'recurring',
      );
      res.json(lists);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/board/lists', requireProfile, (req, res, next) => {
    try {
      const rawBody = (req.body ?? {}) as Record<string, unknown>;
      const type = rawBody.type ?? 'one_off';
      if (type !== 'one_off' && type !== 'recurring') {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['type must be one_off or recurring'] });
        return;
      }
      const parsed = ChecklistInputSchema.safeParse({ ...rawBody, type });
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(checklistRepo.create(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/v1/board/lists/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const list = checklistRepo.get(id);
      if (!list) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(list);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/board/lists/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!checklistRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const parsed = ChecklistUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.json(checklistRepo.update(id, parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/board/lists/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!checklistRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      checklistRepo.delete(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/board/lists/:id/items', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!checklistRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const parsed = ChecklistItemInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(checklistRepo.createItem(id, parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/board/lists/:id/items/:itemId', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const itemId = Number(req.params.itemId);
      if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(itemId) || itemId <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const parsed = ChecklistItemUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.json(checklistRepo.updateItem(itemId, parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/board/lists/:id/items/:itemId', requireProfile, (req, res, next) => {
    try {
      const itemId = Number(req.params.itemId);
      if (!Number.isInteger(itemId) || itemId <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      checklistRepo.deleteItem(itemId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/board/lists/:id/reset', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      if (!checklistRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      checklistRepo.resetItems(id);
      res.json(checklistRepo.get(id));
    } catch (err) {
      next(err);
    }
  });

  // ─── Guest Checklists ─────────────────────────────────────────────────────────

  router.get('/api/v1/board/guest-checklists', requireProfile, (_req, res, next) => {
    try {
      const guests = checklistRepo.list().filter((c) => c.guest_name != null);
      res.json(guests);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/board/guest-checklists', requireProfile, (req, res, next) => {
    try {
      const rawReqBody = (req.body ?? {}) as Record<string, unknown>;
      const parsed = ChecklistInputSchema.safeParse({ ...rawReqBody, type: 'one_off' });
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      if (!parsed.data.guest_name) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['guest_name is required'] });
        return;
      }
      const checklist = checklistRepo.create(parsed.data);

      const template = typeof req.body === 'object' && req.body !== null
        ? (req.body as Record<string, unknown>).template
        : undefined;
      const templateStr = typeof template === 'string' ? template : undefined;
      const arrivalItems = [
        { text: 'Fresh towels in bathroom', sort_order: 0 },
        { text: 'Toiletries stocked', sort_order: 1 },
        { text: 'Clean bedding on bed', sort_order: 2 },
        { text: 'Room hoovered and dusted', sort_order: 3 },
        { text: 'Welcome note written', sort_order: 4 },
        { text: 'Wardrobe space cleared', sort_order: 5 },
        { text: 'Wifi password left out', sort_order: 6 },
      ];
      const departureItems = [
        { text: 'Strip and wash bed linen', sort_order: 0 },
        { text: 'Check bathroom for belongings', sort_order: 1 },
        { text: 'Check all rooms for belongings', sort_order: 2 },
        { text: 'Collect spare key', sort_order: 3 },
        { text: 'Hoover and dust room', sort_order: 4 },
        { text: 'Send thank-you message', sort_order: 5 },
      ];

      const items = templateStr === 'departure' ? departureItems : arrivalItems;
      items.forEach((item) => checklistRepo.createItem(checklist.id, item));

      res.status(201).json(checklistRepo.get(checklist.id));
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/v1/board/guest-checklists/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const checklist = checklistRepo.get(id);
      if (!checklist || checklist.guest_name == null) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(checklist);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/board/guest-checklists/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const existing = checklistRepo.get(id);
      if (!existing || existing.guest_name == null) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const parsed = ChecklistUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.json(checklistRepo.update(id, parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/board/guest-checklists/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const existing = checklistRepo.get(id);
      if (!existing || existing.guest_name == null) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      checklistRepo.delete(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/board/guest-checklists/:id/items', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const existing = checklistRepo.get(id);
      if (!existing || existing.guest_name == null) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const parsed = ChecklistItemInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.status(201).json(checklistRepo.createItem(id, parsed.data));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/board/guest-checklists/:id/items/:itemId', requireProfile, (req, res, next) => {
    try {
      const itemId = Number(req.params.itemId);
      if (!Number.isInteger(itemId) || itemId <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: ['invalid id'] });
        return;
      }
      const parsed = ChecklistItemUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      res.json(checklistRepo.updateItem(itemId, parsed.data));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
