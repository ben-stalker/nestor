import { z } from 'zod';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import type AppSettingsRepository from '../repositories/AppSettingsRepository';
import type { CryptoService } from '../utils/crypto';
import { validateAccount } from '../services/OctopusClient';

const CredentialsBodySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
});

const OCTOPUS_KEYS = [
  'octopus_api_key',
  'octopus_account_number',
  'octopus_mpan',
  'octopus_meter_serial',
  'octopus_gas_mprn',
  'octopus_gas_meter_serial',
  'octopus_tariff_code',
] as const;

export default function createOctopusRouter(
  settingsRepo: AppSettingsRepository,
  cryptoService: CryptoService,
  requireAdminPin: RequestHandler,
): Router {
  const router = Router();

  // GET /api/v1/octopus/status
  router.get('/api/v1/octopus/status', (_req, res, next) => {
    try {
      const encryptedKey = settingsRepo.get<string>('octopus_api_key');
      const configured = Boolean(encryptedKey);
      const accountNumber = settingsRepo.get<string>('octopus_account_number') ?? null;
      const mpan = settingsRepo.get<string>('octopus_mpan') ?? null;
      const meterSerial = settingsRepo.get<string>('octopus_meter_serial') ?? null;
      const gasMprn = settingsRepo.get<string>('octopus_gas_mprn') ?? null;
      const gasMeterSerial = settingsRepo.get<string>('octopus_gas_meter_serial') ?? null;
      const tariffCode = settingsRepo.get<string>('octopus_tariff_code') ?? null;

      res.json({
        configured,
        accountNumber,
        mpan,
        meterSerial,
        gasMprn,
        gasMeterSerial,
        tariffCode,
      });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/octopus/credentials
  router.post('/api/v1/octopus/credentials', requireAdminPin, async (req, res, next) => {
    try {
      const parsed = CredentialsBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'validation',
          code: 'INVALID_INPUT',
          details: parsed.error.issues,
        });
        return;
      }

      const { apiKey, accountNumber } = parsed.data;

      let meterInfo: Awaited<ReturnType<typeof validateAccount>>;
      try {
        meterInfo = await validateAccount(apiKey, accountNumber);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to validate with Octopus API';
        res.status(422).json({ error: 'OCTOPUS_VALIDATION_FAILED', message });
        return;
      }

      const encryptedKey = cryptoService.encrypt(apiKey);

      settingsRepo.setMany({
        octopus_api_key: encryptedKey,
        octopus_account_number: accountNumber,
        ...(meterInfo.mpan != null ? { octopus_mpan: meterInfo.mpan } : {}),
        ...(meterInfo.meterSerial != null ? { octopus_meter_serial: meterInfo.meterSerial } : {}),
        ...(meterInfo.gasMprn != null ? { octopus_gas_mprn: meterInfo.gasMprn } : {}),
        ...(meterInfo.gasMeterSerial != null
          ? { octopus_gas_meter_serial: meterInfo.gasMeterSerial }
          : {}),
        ...(meterInfo.tariffCode != null ? { octopus_tariff_code: meterInfo.tariffCode } : {}),
      });

      res.json({
        ok: true,
        mpan: meterInfo.mpan,
        meterSerial: meterInfo.meterSerial,
        gasMprn: meterInfo.gasMprn,
        gasMeterSerial: meterInfo.gasMeterSerial,
        tariffCode: meterInfo.tariffCode,
      });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/v1/octopus/credentials
  router.delete('/api/v1/octopus/credentials', requireAdminPin, (_req, res, next) => {
    try {
      OCTOPUS_KEYS.forEach((key) => settingsRepo.delete(key));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
