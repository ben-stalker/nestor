/**
 * 02-profile-switch.spec.ts
 *
 * Tests the profile avatar strip — switching between child (no PIN) and
 * admin (PIN required) profiles.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Profile Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the AvatarStrip to be fully loaded (not in skeleton/loading state)
    await page.waitForSelector('[role="toolbar"][aria-label="Profile switcher"]', {
      timeout: 15_000,
    });
  });

  test('avatar strip is visible with multiple profiles', async ({ page }) => {
    // The avatar strip has role="toolbar" and aria-label="Profile switcher"
    const avatarStrip = page.getByRole('toolbar', { name: /Profile switcher/i });
    await expect(avatarStrip).toBeVisible();

    // Should have at least 2 profile buttons (Admin + Alice)
    const profileButtons = avatarStrip.getByRole('button');
    await expect(profileButtons).toHaveCount(2);

    // Run axe on home page
    const { violations } = await new AxeBuilder({ page }).analyze();
    const criticalViolations = violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations).toHaveLength(0);
  });

  test('clicking child profile (no PIN) switches active profile', async ({ page }) => {
    const avatarStrip = page.getByRole('toolbar', { name: /Profile switcher/i });

    // Click Alice (child profile — no PIN required)
    const aliceButton = avatarStrip.getByRole('button', { name: /Switch to Alice/i });
    await aliceButton.click();

    // No PIN prompt should appear for child without PIN
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3_000 });

    // Child profiles redirect from / to /me — that URL change confirms the profile switch
    await page.waitForURL(/\/me/, { timeout: 10_000 });
  });

  test('clicking admin profile (has PIN) shows PIN prompt', async ({ page }) => {
    const avatarStrip = page.getByRole('toolbar', { name: /Profile switcher/i });

    // Clicking Admin always shows the PIN prompt (even when Admin is already the active profile)
    const adminButton = avatarStrip.getByRole('button', { name: /Switch to Admin/i });
    await adminButton.click();

    // PIN prompt dialog should appear
    const pinDialog = page.getByRole('dialog');
    await expect(pinDialog).toBeVisible();

    // Should show Admin's name in the dialog
    await expect(pinDialog.getByText(/Admin/i)).toBeVisible();
  });

  test('entering correct PIN dismisses the dialog', async ({ page }) => {
    const avatarStrip = page.getByRole('toolbar', { name: /Profile switcher/i });

    // Click Admin to open PIN prompt
    const adminButton = avatarStrip.getByRole('button', { name: /Switch to Admin/i });
    await adminButton.click();

    // Enter PIN "0000" using the keypad buttons
    for (const digit of ['0', '0', '0', '0']) {
      await page.getByRole('button', { name: new RegExp(`^${digit}$`) }).click();
    }

    // After correct PIN, dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });
});
