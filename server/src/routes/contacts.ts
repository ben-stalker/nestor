import { Router } from 'express';
import type { RequestHandler } from 'express';
import createRequireProfile from '../middleware/requireProfile';
import type ContactRepository from '../repositories/ContactRepository';
import type ProfileRepository from '../repositories/ProfileRepository';
import { ContactInputSchema, CONTACT_CATEGORIES } from '../types/contacts';

export default function createContactsRouter(
  contactRepo: ContactRepository,
  requireAdminPin: RequestHandler,
  profileRepo: ProfileRepository,
): Router {
  const router = Router();
  const requireProfile = createRequireProfile(profileRepo);

  router.get('/api/v1/contacts', requireProfile, (req, res, next) => {
    try {
      const cat = req.query.category as string | undefined;

      if (cat && !CONTACT_CATEGORIES.includes(cat as (typeof CONTACT_CATEGORIES)[number])) {
        res.status(400).json({ error: 'validation', code: 'INVALID_CATEGORY' });
        return;
      }

      const profileType = req.profile!.type;

      if (profileType === 'child') {
        res.json(contactRepo.list({ category: 'emergency' }));
        return;
      }

      res.json(cat ? contactRepo.list({ category: cat }) : contactRepo.list());
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/v1/contacts/:id', requireProfile, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT' });
        return;
      }
      const contact = contactRepo.get(id);
      if (!contact) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const profileType = req.profile!.type;
      if (profileType === 'child' && contact.category !== 'emergency') {
        res.status(403).json({ error: 'FORBIDDEN' });
        return;
      }
      res.json(contact);
    } catch (err) {
      next(err);
    }
  });

  router.post('/api/v1/contacts', requireProfile, requireAdminPin, (req, res, next) => {
    try {
      const parsed = ContactInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const contact = contactRepo.create(parsed.data);
      res.status(201).json(contact);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/api/v1/contacts/:id', requireProfile, requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT' });
        return;
      }
      if (!contactRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      const parsed = ContactInputSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }
      const updated = contactRepo.update(id, parsed.data);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/api/v1/contacts/:id', requireProfile, requireAdminPin, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'validation', code: 'INVALID_INPUT' });
        return;
      }
      if (!contactRepo.get(id)) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      contactRepo.delete(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
