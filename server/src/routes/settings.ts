import { Router } from 'express';
import AppSettingsRepository from '../repositories/AppSettingsRepository';
import { getDb } from '../db/connection';

const router = Router();
const repo = new AppSettingsRepository(getDb());

router.get('/', (_req, res) => {
  res.json(repo.getAll());
});

export default router;
