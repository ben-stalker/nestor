import { Router } from 'express';
import { z } from 'zod';
import {
  testBasicAuthCalDAV,
  APPLE_CALDAV_URL,
  YAHOO_CALDAV_URL,
} from '../services/calendar/BasicAuthCalDAVProvider';
import type CalendarAccountRepository from '../repositories/CalendarAccountRepository';
import type CalendarService from '../services/CalendarService';
import type { CalendarProvider } from '../types/calendar';

const DEFAULT_URLS: Record<string, string> = {
  apple: APPLE_CALDAV_URL,
  yahoo: YAHOO_CALDAV_URL,
};

const ConnectBodySchema = z.object({
  provider: z.enum(['apple', 'yahoo']),
  display_name: z.string().min(1).max(200).optional(),
  username: z.string().min(1),
  password: z.string().min(1),
  caldav_url: z.string().url().optional(),
  sync_interval_mins: z.number().int().min(1).optional().default(15),
  profile_id: z.number().int().positive().nullable().optional(),
});

const TestBodySchema = z.object({
  provider: z.enum(['apple', 'yahoo']),
  username: z.string().min(1),
  password: z.string().min(1),
  caldav_url: z.string().url().optional(),
});

export default function createBasicCalendarRouter(
  accountRepo: CalendarAccountRepository,
  calendarService: CalendarService,
): Router {
  const router = Router();

  // Test credentials without persisting
  router.post('/api/v1/calendar/accounts/basic/test', async (req, res, next) => {
    try {
      const parsed = TestBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }

      const { provider, username, password } = parsed.data;
      const caldavUrl = parsed.data.caldav_url;
      const serverUrl = caldavUrl ?? DEFAULT_URLS[provider] ?? APPLE_CALDAV_URL;

      const ok = await testBasicAuthCalDAV(serverUrl, { username, password });
      res.json({ ok });
    } catch (err) {
      next(err);
    }
  });

  // Create (and first-sync) a Basic-auth CalDAV account
  router.post('/api/v1/calendar/accounts/basic', (req, res, next) => {
    try {
      const parsed = ConnectBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'validation', code: 'INVALID_INPUT', details: parsed.error.issues });
        return;
      }

      const { provider, username, password } = parsed.data;
      const caldavUrl = parsed.data.caldav_url;
      const syncIntervalMins = parsed.data.sync_interval_mins;
      const profileId = parsed.data.profile_id;

      const defaultUrl = DEFAULT_URLS[provider] ?? APPLE_CALDAV_URL;
      const serverUrl = caldavUrl ?? defaultUrl;

      const displayName =
        parsed.data.display_name ??
        (provider === 'apple' ? `iCloud (${username})` : `Yahoo (${username})`);

      const account = accountRepo.create({
        provider: provider as CalendarProvider,
        display_name: displayName,
        caldav_url: serverUrl,
        credentials: { username, password },
        sync_interval_mins: syncIntervalMins,
        profile_id: profileId ?? null,
      });

      void calendarService.syncAccount(account.id);

      res.status(201).json(account);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
