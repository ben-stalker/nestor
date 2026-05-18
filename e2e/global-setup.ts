/**
 * Playwright global setup — seeds the test database before all tests run.
 *
 * This runs BEFORE the webServer starts (Playwright starts webServer after globalSetup).
 * We just prepare the DB file here; the server will run migrations on startup.
 */
import { seedTestDb } from './fixtures/seed';

export default function globalSetup(): void {
  const result = seedTestDb();
  console.log('[E2E global-setup] Database seeded:', result);
}
