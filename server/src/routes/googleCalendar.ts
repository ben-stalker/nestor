import { Router } from 'express';
import QRCode from 'qrcode';
import {
  storePendingCode,
  getPendingCode,
  removePendingCode,
} from '../services/calendar/google/deviceCodeStore';
import type CalendarAccountRepository from '../repositories/CalendarAccountRepository';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import type CalendarService from '../services/CalendarService';

const GOOGLE_DEVICE_CODE_URL = 'https://oauth2.googleapis.com/device/code';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_CALDAV_BASE = 'https://apidata.googleusercontent.com/caldav/v2/';
const GOOGLE_CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email';

interface GoogleDeviceResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}

interface GoogleUserInfo {
  email?: string;
}

function getOauthClientId(settingsRepo: AppSettingsRepository): string {
  const fromSettings = settingsRepo.get<string>('google_oauth_client_id');
  if (fromSettings) return fromSettings;
  const fromEnv = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (fromEnv) return fromEnv;
  throw new Error('Google OAuth client ID not configured');
}

function getOauthClientSecret(settingsRepo: AppSettingsRepository): string {
  const fromSettings = settingsRepo.get<string>('google_oauth_client_secret');
  if (fromSettings) return fromSettings;
  const fromEnv = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (fromEnv) return fromEnv;
  throw new Error('Google OAuth client secret not configured');
}

export default function createGoogleCalendarRouter(
  accountRepo: CalendarAccountRepository,
  settingsRepo: AppSettingsRepository,
  calendarService: CalendarService,
): Router {
  const router = Router();

  // Initiate device code flow; returns QR code and verification URL
  router.post('/api/v1/calendar/accounts/google/start', async (_req, res, next) => {
    try {
      const clientId = getOauthClientId(settingsRepo);

      const deviceRes = await fetch(GOOGLE_DEVICE_CODE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          scope: GOOGLE_CALENDAR_SCOPE,
        }).toString(),
      });

      if (!deviceRes.ok) {
        const text = await deviceRes.text();
        res.status(502).json({ error: 'GOOGLE_AUTH_FAILED', details: text });
        return;
      }

      const data = (await deviceRes.json()) as GoogleDeviceResponse;

      const qrPng = await new Promise<string>((resolve, reject) => {
        QRCode.toDataURL(data.verification_url, (err: Error | null | undefined, url: string) => {
          if (err) reject(err);
          else resolve(url);
        });
      });

      storePendingCode({
        deviceCode: data.device_code,
        userCode: data.user_code,
        verificationUrl: data.verification_url,
        expiresAt: Date.now() + data.expires_in * 1000,
        interval: data.interval,
      });

      res.json({
        deviceCode: data.device_code,
        verificationUrl: data.verification_url,
        qrPng,
      });
    } catch (err) {
      next(err);
    }
  });

  // Poll for authorization result
  router.get('/api/v1/calendar/accounts/google/poll/:deviceCode', async (req, res, next) => {
    try {
      const { deviceCode } = req.params;
      const pending = getPendingCode(deviceCode);

      if (!pending) {
        res.status(410).json({ error: 'DEVICE_CODE_EXPIRED' });
        return;
      }

      const clientId = getOauthClientId(settingsRepo);
      const clientSecret = getOauthClientSecret(settingsRepo);

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }).toString(),
      });

      const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

      if (tokenData.error === 'authorization_pending') {
        res.json({ status: 'pending' });
        return;
      }

      if (tokenData.error === 'slow_down') {
        res.json({ status: 'pending', retryAfter: pending.interval + 5 });
        return;
      }

      if (tokenData.error === 'access_denied' || tokenData.error === 'expired_token') {
        removePendingCode(deviceCode);
        res.status(410).json({ error: tokenData.error.toUpperCase() });
        return;
      }

      if (!tokenData.access_token || !tokenData.refresh_token) {
        res.status(502).json({ error: 'GOOGLE_TOKEN_INVALID' });
        return;
      }

      // Discover user email for a more specific CalDAV URL
      let email: string | undefined;
      try {
        const infoRes = await fetch(GOOGLE_USERINFO_URL, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (infoRes.ok) {
          const info = (await infoRes.json()) as GoogleUserInfo;
          email = info.email;
        }
      } catch {
        // best-effort; fall back to base URL
      }

      const caldavUrl = email ? `${GOOGLE_CALDAV_BASE}${email}/` : GOOGLE_CALDAV_BASE;

      const credentials = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiry: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
        client_id: clientId,
        client_secret: clientSecret,
        email,
      };

      const account = accountRepo.create({
        provider: 'google',
        display_name: email ? `Google (${email})` : 'Google Calendar',
        caldav_url: caldavUrl,
        credentials,
        sync_interval_mins: 15,
      });

      removePendingCode(deviceCode);
      void calendarService.syncAccount(account.id);

      res.json({ status: 'authorized', accountId: account.id });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/calendar/accounts — list all connected accounts (admin only)
  router.get('/api/v1/calendar/accounts', (_req, res) => {
    res.json(accountRepo.list());
  });

  // DELETE /api/v1/calendar/accounts/:id — remove a connected account
  router.delete('/api/v1/calendar/accounts/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'Invalid account id' });
      return;
    }
    const deleted = accountRepo.delete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    res.status(204).end();
  });

  // PATCH /api/v1/calendar/accounts/:id/sync-interval — update sync interval
  router.patch('/api/v1/calendar/accounts/:id/sync-interval', (req, res) => {
    const id = Number(req.params.id);
    const interval = Number((req.body as { interval?: unknown }).interval);
    if (!Number.isFinite(id) || !Number.isFinite(interval) || interval < 5) {
      res.status(400).json({ error: 'Invalid id or interval' });
      return;
    }
    accountRepo.update(id, { sync_interval_mins: interval });
    res.status(204).end();
  });

  return router;
}
