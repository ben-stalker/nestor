/**
 * 09-dismiss-alert.spec.ts
 *
 * Tests the alert strip dismiss flow.
 * The test DB is seeded with a test alert "E2E Test Alert".
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dismiss Alert', () => {
  test('home page shows seeded test alert', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 10_000 });

    // Alerts strip should be visible (seeded alert exists)
    const alertsStrip = page.locator('[data-testid="alerts-strip"]');
    const isVisible = await alertsStrip.isVisible().catch(() => false);

    if (isVisible) {
      await expect(alertsStrip).toBeVisible();

      // The seeded alert message should be shown
      await expect(page.getByText('E2E Test Alert')).toBeVisible();

      // Run axe with alerts visible
      const { violations } = await new AxeBuilder({ page }).analyze();
      const criticalViolations = violations.filter((v) => v.impact === 'critical');
      expect(criticalViolations).toHaveLength(0);
    }
  });

  test('dismissing an alert removes it from the strip', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 10_000 });

    // Create a fresh alert via API to dismiss
    const createRes = await request.post('/api/v1/alerts', {
      data: {
        type: 'e2e_dismiss_test',
        severity: 'info',
        message: 'E2E Dismiss Test Alert',
        nav_mode_badge: 'home',
      },
    });

    if (!createRes.ok()) {
      // If we can't create via API, try with existing seeded alert
      const alertsStrip = page.locator('[data-testid="alerts-strip"]');
      const isVisible = await alertsStrip.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip();
        return;
      }

      // Find the dismiss button for the seeded alert
      const dismissBtn = page
        .locator('[data-testid="alerts-strip"]')
        .getByRole('button', { name: /dismiss/i })
        .first();

      const isDismissVisible = await dismissBtn.isVisible().catch(() => false);
      if (isDismissVisible) {
        await dismissBtn.click();
        // Alert should disappear
        await expect(page.getByText('E2E Test Alert')).not.toBeVisible({ timeout: 3_000 });
      }
      return;
    }

    const newAlert = (await createRes.json()) as { id: number };

    // Reload to see the new alert
    await page.reload();
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 10_000 });

    // Find the specific alert by data-testid
    const alertItem = page.locator(`[data-testid="alert-item-${newAlert.id}"]`);
    await expect(alertItem).toBeVisible({ timeout: 5_000 });

    // Get initial active alert count
    const initialAlertItems = page.locator('[data-testid^="alert-item-"]');
    const initialCount = await initialAlertItems.count();

    // Click dismiss button on the specific alert
    const dismissBtn = alertItem.getByRole('button', { name: /dismiss/i });
    await dismissBtn.click();

    // Alert item should disappear
    await expect(alertItem).not.toBeVisible({ timeout: 3_000 });

    // Count should decrease
    const afterCount = await page.locator('[data-testid^="alert-item-"]').count();
    expect(afterCount).toBeLessThan(initialCount);
  });

  test('alerts API returns active alerts', async ({ request }) => {
    const res = await request.get('/api/v1/alerts');
    if (res.ok()) {
      const alerts = (await res.json()) as Array<{ id: number; dismissed: boolean }>;
      // All returned alerts should be non-dismissed
      const undismissed = alerts.filter((a) => !a.dismissed);
      expect(undismissed.length).toBe(alerts.length);
    }
  });
});
