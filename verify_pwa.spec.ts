import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should show dashboard skeleton on load', async ({ page }) => {
    const skeleton = page.locator('.animate-pulse');
    await expect(skeleton.first()).toBeVisible();
  });

  test('should show network status when offline', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    const offlineBar = page.locator('text=⚡ Offline — changes will sync when connected');
    await expect(offlineBar).toBeVisible();

    // Simulate online
    await page.context().setOffline(false);
    const onlineBar = page.locator('text=✓ Back online — syncing...');
    await expect(onlineBar).toBeVisible();
  });
});
